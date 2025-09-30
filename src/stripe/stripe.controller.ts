import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards, Query } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { CreateStripeDto } from './dto/create-stripe.dto';
import { UpdateStripeDto } from './dto/update-stripe.dto';
import { JwtGuards } from 'src/common/guards/jwt-guards';

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
}
