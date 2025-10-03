import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateStripeDto } from './dto/create-stripe.dto';
import { UpdateStripeDto } from './dto/update-stripe.dto';
import Stripe from 'stripe';
import { WalletService } from 'src/wallet/wallet.service';
import { UsersService } from 'src/users/users.service';
@Injectable()
export class StripeService {
  public stripe;
  constructor(
    private readonly walletService: WalletService,
    private readonly userService: UsersService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  async createCustomer(email) {
    const customer = await this.stripe.customers.create({ email });
    return customer;
  }

  async createCheckoutSession(
    userId: string,
    amountInCents: number,
    stripeCustomerId: string,
  ) {
    if (
      !stripeCustomerId ||
      typeof stripeCustomerId !== 'string' ||
      !stripeCustomerId.startsWith('cus_')
    ) {
      throw new BadRequestException('Invalid or missing Stripe customer ID');
    }
    if (!Number.isInteger(amountInCents) || amountInCents <= 0) {
      throw new BadRequestException(
        'Amount must be a positive integer in cents',
      );
    }
    if (!userId || typeof userId !== 'string') {
      throw new BadRequestException('Invalid or missing user ID');
    }

    try {
      await this.stripe.customers.retrieve(stripeCustomerId).catch((err) => {
        throw new BadRequestException(
          `Invalid Stripe customer: ${err.message}`,
        );
      });

      const session = await this.stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Wallet Top-Up',
              },
              unit_amount: Math.round(amountInCents),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url:
          'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'http://localhost:3000/cancel',
        client_reference_id: userId,
        metadata: { userId, topUpAmount: amountInCents / 100 },
      });

      return { url: session.url };
    } catch (error) {
      // Log raw error for debugging
      console.error('Stripe error:', error);
      throw new BadRequestException(
        `Checkout session creation failed: ${error.message}`,
      );
    }
  }

  async handleCheckoutEvent(body, signature, webHookSecret) {
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        webHookSecret,
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
    console.log('---------------Event----------');
    console.log(event);
    console.log('---------------Event----------');
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const userId = intent.metadata?.userId;
      const amountInDollars = intent.amount / 100;
      if (!userId) {
        console.error('Missing userId in payment intent');
        return { received: true };
      }
      await this.walletService.update(
        { user: userId },
        { $inc: { availableBalance: amountInDollars } },
      );
      console.log(`Updated balance for user ${userId} by $${amountInDollars}`);
    }
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id || session.metadata?.userId;
      const amountInDollars = session.amount_total! / 100; // Convert cents to dollars

      if (!userId) {
        console.error('Missing userId in session');
        return { received: true }; // Still acknowledge to Stripe
      }

      // Update wallet balance
      await this.walletService.update(
        { user: userId },
        { $inc: { availableBalance: amountInDollars } },
      );
      console.log(`Updated balance for user ${userId} by $${amountInDollars}`);
    }
    return { received: true };
  }
  async startOnboarding(userId: string) {
    const user = await this.userService.findOne({ _id: userId });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (user.stripeConnectedAccountId) {
      throw new BadRequestException('User already onboarded');
    }

    try {
      console.log('Creating account for user:', userId);
      const account = await this.stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: { userId },
      });

      console.log('Account created:', account.id);
      await this.userService.findByIdAndUpdate(userId, {
        stripeConnectedAccountId: account.id,
      });

      const accountLink = await this.stripe.accountLinks.create({
        account: account.id,
        refresh_url: 'http://localhost:3000/stripe/onboard-refresh',
        return_url: 'http://localhost:3000/stripe/onboard-return',
        type: 'account_onboarding',
        collect: 'eventually_due',
      });

      console.log('Account link created:', accountLink.url);
      return { url: accountLink.url };
    } catch (error) {
      console.error('Onboarding error:', error.message, error.stack);
      throw new BadRequestException(`Onboarding failed: ${error.message}`);
    }
  }
  async getOrCreateCustomer(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        metadata: { userId: userId.toString() },
      });
      stripeCustomerId = customer.id;
      return stripeCustomerId;
    }
    return stripeCustomerId;
  }
  async createSetupIntent(userId: string) {
    const customerId = await this.getOrCreateCustomer(userId);
    const setupIntent = await this.stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: [
        'card',
        'us_bank_account', // or sepa_debit / bancontact depending on region
      ],
    });
    return { clientSecret: setupIntent.client_secret };
  }
  async createPaymentIntent(
    userId: string,
    amountInCents: number,
    stripeCustomerId: string,
  ) {
    if (!stripeCustomerId || !stripeCustomerId.startsWith('cus_')) {
      throw new BadRequestException('Invalid or missing Stripe customer ID');
    }

    if (!Number.isInteger(amountInCents) || amountInCents <= 0) {
      throw new BadRequestException(
        'Amount must be a positive integer in cents',
      );
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        customer: stripeCustomerId,
        description: 'Wallet Top-Up',
        metadata: { userId, topUpAmount: amountInCents / 100 },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return { clientSecret: paymentIntent.client_secret };
    } catch (error) {
      console.error('Stripe error:', error);
      throw new BadRequestException(
        `PaymentIntent creation failed: ${error.message}`,
      );
    }
  }
  async listSavedCards(userId: string) {
    const customerId = await this.getOrCreateCustomer(userId);
    return this.stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
  }
  async getDefaultPaymentMethod(customerId: string) {
    const customer = await this.stripe.customers.retrieve(customerId);
    let defaultPaymentMethodId: any = null;

    if (!customer.deleted) {
      defaultPaymentMethodId =
        customer.invoice_settings?.default_payment_method || null;
    }
    return defaultPaymentMethodId;
  }
  async getDefaultOrFirstSavedCard(customerId: string) {
    const defaultPaymentMethodId =
      await this.getDefaultPaymentMethod(customerId);
    if (defaultPaymentMethodId) {
      return defaultPaymentMethodId;
    }
    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    if (paymentMethods.data.length === 0) {
      throw new Error('No saved cards found for this customer.');
    }
    return paymentMethods.data[0].id;
  }

  async setDefaultCard(paymentMethodId: string, userId: string) {
    const customerId = await this.getOrCreateCustomer(userId);
    return this.stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
  }

  async chargeSavedCard(
    userId: string,
    amount: number,
    metadata?: Record<string, string>,
  ) {
    try {
      const customerId = await this.getOrCreateCustomer(userId);
      const paymentMethodId = await this.getDefaultOrFirstSavedCard(customerId);
      const paymentIntent = await this.stripe.paymentIntents.create({
        customer: customerId,
        payment_method: paymentMethodId,
        amount: amount * 100,
        currency: 'usd',
        off_session: true,
        confirm: true,
        metadata: metadata || {},
      });

      if (paymentIntent.status !== 'succeeded') {
        throw new Error(`Payment failed with status: ${paymentIntent.status}`);
        // await this.ledgerService.addToLedger({
        //   type: 'credit',
        //   amount: params.amount,
        //   userId: params.userId,
        //   description: params.metadata?.reason || 'Wallet Top-Up',
        //   stripeTransactionId: paymentIntent.id,
        // });
      } //else {
      //   throw new Error(`Payment failed with status: ${paymentIntent.status}`);
      // }
      return paymentIntent;
    } catch (error) {
      console.log(error?.raw?.message, 'error');
      if (error instanceof Stripe.errors.StripeCardError) {
        throw new Error('Card declined or other card-related error.');
      } else if (error instanceof Stripe.errors.StripeInvalidRequestError) {
        throw new Error(
          `Invalid request to Stripe API. ${(error?.raw as any)?.message}`,
        );
      } else if (error instanceof Stripe.errors.StripeAPIError) {
        throw new Error('Stripe API error occurred.');
      } else if (error instanceof Stripe.errors.StripeConnectionError) {
        throw new Error('Network error while communicating with Stripe.');
      } else if (error instanceof Stripe.errors.StripeAuthenticationError) {
        throw new Error('Authentication error with Stripe API.');
      } else {
        throw new Error(`Unexpected error: ${error.message}`);
      }
    }
  }

  // One-time payment with mobile money
  async createWalletPaymentIntent(userId: string, amount: number, currency: string) {
    const customerId = await this.getOrCreateCustomer(userId);
    return await this.stripe.paymentIntents.create({
      amount: amount, // e.g. 5000 for $50.00
      currency: 'usd', // "xof" for Orange Money, "ugx"/"ghs" for MTN MoMo
      customer: customerId,
      payment_method_types: ['amazon_pay'],
    });
  }
}
