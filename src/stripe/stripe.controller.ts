import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  Query,
  HttpCode,
  Headers,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { JwtGuards } from 'src/common/guards/jwt-guards';
import { Request as ExpressRequest } from 'express';
import { ChargeCardDto } from './dto/charge-card.dto';
interface RawBodyRequest extends ExpressRequest {
  rawBody: Buffer;
}
@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @UseGuards(JwtGuards)
  @Get('onboard-stripe-connect')
  async onboardWithdrawal(@Request() request: any) {
    const user = request.user;
    return this.stripeService.startOnboarding(user._id.toString());
  }
  @UseGuards(JwtGuards)
  @Post('create-checkout-session')
  createCheckoutSession(@Request() request, @Query('amount') amount) {
    const user = request.user;
    return this.stripeService.createCheckoutSession(
      user._id.toString(),
      Number(amount),
      user.stripeCustomerId,
    );
  }
  @UseGuards(JwtGuards)
  @Post('create-payment-intent')
  async createPaymentIntent(@Request() request, @Query('amount') amount) {
    const user = request.user;
    return this.stripeService.createPaymentIntent(
      user._id.toString(),
      Number(amount),
      user.stripeCustomerId,
    );
  }

  @UseGuards(JwtGuards)
  @Get('saved-cards')
  async listCards(@Request() request) {
    return this.stripeService.listSavedCards(request.user._id);
  }

  @UseGuards(JwtGuards)
  @Post('charge')
  async chargeSavedCard(@Request() request, @Body() body: ChargeCardDto) {
    const paymentIntent = await this.stripeService.chargeSavedCard(
      request.user._id,
      body.amount,
      { ...body.metadata, userId: request.user._id.toString() },
    );
    return {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    };
  }

  @UseGuards(JwtGuards)
  @Post('set-default-card')
  async setDefaultCard(@Request() request, @Body() body) {
    const { paymentMethodId } = body;
    return this.stripeService.setDefaultCard(paymentMethodId, request.user._id);
  }

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest,
    @Headers('stripe-signature') signature: string,
  ) {
    console.log('--------------WEBHOOK HIT-----------');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }
    const body = req.rawBody || req.body;
    return this.stripeService.handleCheckoutEvent(
      body,
      signature,
      webhookSecret,
    );
  }
  @UseGuards(JwtGuards)
  @Post('setup-intent')
  async setupIntent(@Request() request) {
    return this.stripeService.createSetupIntent(request.user._id);
  }

  @UseGuards(JwtGuards)
  @Post("wallet-intent")
  async setupWalletIntent(@Body() body, @Request() request){
    return this.stripeService.createWalletPaymentIntent(request.user._id, body.amount, body.currency);
  }
}
