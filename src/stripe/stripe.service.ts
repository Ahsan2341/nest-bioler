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
  create(createStripeDto: CreateStripeDto) {
    return 'This action adds a new stripe';
  }

  findAll() {
    return `This action returns all stripe`;
  }

  findOne(id: number) {
    return `This action returns a #${id} stripe`;
  }

  update(id: number, updateStripeDto: UpdateStripeDto) {
    return `This action updates a #${id} stripe`;
  }

  remove(id: number) {
    return `This action removes a #${id} stripe`;
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
    const user = await this.userService.findOne({_id:userId});
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (user.stripeConnectedAccountId) {
      throw new BadRequestException('User already onboarded');
    }

    try {
      console.log('Creating account for user:', userId); // Debug log
      const account = await this.stripe.accounts.create({
        type: 'standard',
        country: 'US', // Adjust dynamically if needed (e.g., based on user location)
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual', // Default; adjust if business accounts needed
        metadata: { userId },
      });

      console.log('Account created:', account.id); // Debug log
      await this.userService.findByIdAndUpdate(userId, { stripeConnectedAccountId: account.id });

      const accountLink = await this.stripe.accountLinks.create({
        account: account.id,
        refresh_url: 'http://localhost:3000/stripe/onboard-refresh',
        return_url: 'http://localhost:3000/stripe/onboard-return',
        type: 'account_onboarding',
        collect: 'eventually_due', // Collect required info now
      });

      console.log('Account link created:', accountLink.url); // Debug log
      return { url: accountLink.url };
    } catch (error) {
      console.error('Onboarding error:', error.message, error.stack);
      throw new BadRequestException(`Onboarding failed: ${error.message}`);
    }
  }
}
