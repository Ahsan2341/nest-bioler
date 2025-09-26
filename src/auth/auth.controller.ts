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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Inject(UsersService)
  private readonly userService: UsersService;
  @Post('sign-up')
  async SignUp(@Body() createUserDto: CreateUserDto) {
    const existingUser=await this.userService.findOne({email:createUserDto.email});
    if(existingUser){
      throw new BadRequestException("User with this email already exists");
    }
    return this.userService.create(createUserDto);
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
}
