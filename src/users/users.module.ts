import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserRepository } from './user.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './entities/user.entity';
import { JwtAuthService } from 'src/common/services/jwt-auth-service';
import { StripeModule } from 'src/stripe/stripe.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    StripeModule
  ],
  controllers: [UsersController],
  providers: [UsersService, UserRepository, JwtAuthService],
  exports: [UsersService, UserRepository],
})
export class UsersModule {}
