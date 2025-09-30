import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { User } from 'src/users/entities/user.entity';

export type WalletDocument = HydratedDocument<Wallet>;
@Schema({ timestamps: true })
export class Wallet {
  @Prop({
    required: true,
    unique: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
  })
  user: User;

  @Prop({ default: 0 })
  availableBalance: number;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
