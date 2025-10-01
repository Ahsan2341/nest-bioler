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
interface RawBodyRequest extends ExpressRequest {
  rawBody: Buffer;
}
@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @UseGuards(JwtGuards)
  @Get('onboard-withdrawal')
  async onboardWithdrawal(@Request() request:any) {
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
}
