import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import * as bcrypt from 'bcrypt';
export type UserDocument = HydratedDocument<User>;
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({})
  profilePicture: string;

  @Prop({ default: '' })
  googleSignInId: string;

  @Prop({ default: false })
  googleSignInEnabled: boolean;
  @Prop()
  passwordResetToken: number;

  @Prop()
  passwordResetTokenExpiresAt: Date;

  @Prop()
  stripeCustomerId: string;

  @Prop({ type: String, default: null })
  stripeConnectedAccountId: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.pre<UserDocument>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
