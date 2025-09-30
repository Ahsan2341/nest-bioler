import { forwardRef, Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { JwtAuthService } from 'src/common/services/jwt-auth-service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [forwardRef(() => UsersModule)],
  controllers: [StripeController],
  providers: [StripeService, JwtAuthService],
  exports: [StripeService],
})
export class StripeModule {}
