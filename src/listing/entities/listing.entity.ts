import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { User } from 'src/users/entities/user.entity';
export type ListingDocument = HydratedDocument<Listing>;
@Schema({ timestamps: true })
export class Listing {
  @Prop({ required: true })
  propertyTitle: string;

  @Prop({ required: true })
  propertyType: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true, default: 1 })
  bedrooms: number;

  @Prop({ required: true, default: 1 })
  bathrooms: number;

  @Prop({ required: true, default: 2200 })
  area: number;

  @Prop({ required: true, default: 800 })
  monthlyRent: number;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  photos: string[];

  @Prop({ required: true })
  amenities: string[];

  @Prop({ required: true, type: Date })
  availableFrom: Date;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: User.name })
  user: MongooseSchema.Types.ObjectId;
}

export const listingSchema = SchemaFactory.createForClass(Listing);
