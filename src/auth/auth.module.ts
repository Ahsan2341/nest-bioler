import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { StripeModule } from 'src/stripe/stripe.module';
import { WalletModule } from 'src/wallet/wallet.module';

@Module({
  imports: [UsersModule, StripeModule, WalletModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
