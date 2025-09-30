import { forwardRef, Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from './entities/wallet.entity';
import { JwtAuthService } from 'src/common/services/jwt-auth-service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }]),
    forwardRef(()=>UsersModule),
  ],
  controllers: [WalletController],
  providers: [WalletService, JwtAuthService],
  exports: [WalletService],
})
export class WalletModule {}
