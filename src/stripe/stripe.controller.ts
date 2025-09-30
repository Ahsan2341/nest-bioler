import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards, Query, HttpCode, Headers, BadRequestException, Req } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { CreateStripeDto } from './dto/create-stripe.dto';
import { UpdateStripeDto } from './dto/update-stripe.dto';
import { JwtGuards } from 'src/common/guards/jwt-guards';
import { Request as ExpressRequest } from 'express';
interface RawBodyRequest extends ExpressRequest {
  rawBody: Buffer;
}
@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post()
  create(@Body() createStripeDto: CreateStripeDto) {
    return this.stripeService.create(createStripeDto);
  }

  @Get()
  findAll() {
    return this.stripeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stripeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStripeDto: UpdateStripeDto) {
    return this.stripeService.update(+id, updateStripeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stripeService.remove(+id);
  }
  @UseGuards(JwtGuards)
  @Post("create-checkout-session")
  createCheckoutSession(@Request() request, @Query("amount") amount){
    const user=request.user
    return this.stripeService.createCheckoutSession(user._id.toString(), Number(amount), user.stripeCustomerId);
  }
  @Post("webhook")
  @HttpCode(200)
  async handleWebhook(@Req() req: RawBodyRequest, @Headers('stripe-signature') signature: string){
    console.log("--------------WEBHOOK HIT-----------");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET; // Set this in .env
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }
    const body = req.rawBody || req.body;
    console.log(body);
    return this.stripeService.handleCheckoutEvent(body, signature, webhookSecret)
  }
}
