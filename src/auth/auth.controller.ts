import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Inject,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login-dto';
import { StripeService } from 'src/stripe/stripe.service';
import { WalletService } from 'src/wallet/wallet.service';
import { ForgotPasswordDto } from './dto/forgot-password';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly stripeService: StripeService,
    private readonly walletService: WalletService,
  ) {}
  @Inject(UsersService)
  private readonly userService: UsersService;
  @Post('sign-up')
  async SignUp(@Body() createUserDto: CreateUserDto) {
    const existingUser = await this.userService.findOne({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }
    const user = await this.userService.create(createUserDto);
    if (!user) {
      throw new BadRequestException('User not created');
    }
    const customerId = await this.stripeService.getOrCreateCustomer(user.data._id);
    // update created user stripeCustomerId
    await this.userService.findByIdAndUpdate(user.data._id, {
      stripeCustomerId: customerId,
    });
    // create user wallet
    await this.walletService.create({ user: user.data._id });
    return user;
  }

  @Post('login')
  async Login(@Body() loginDto: LoginDto) {
    const user = await this.userService.findOne({ email: loginDto.email });
    if (!user) {
      throw new BadRequestException('User with this email does not exist');
    }
    if (
      !(await this.authService.comparePassword(
        loginDto.password,
        user.password,
      ))
    ) {
      throw new UnauthorizedException('Incorrect Credentials');
    }
    const token = await this.authService.createToken(user);
    return { message: 'Login Successfull', token };
  }

  @Post("forgot-password")
  async forgotPassword(@Body() body:ForgotPasswordDto){
    // find user
    const user = await this.userService.findOne({email:body.email});
    if(!user){
      throw new BadRequestException("User with this email does not exist");
    }
    return user
  }
}
