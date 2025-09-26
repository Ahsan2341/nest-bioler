import { Module } from '@nestjs/common';
import { ListingService } from './listing.service';
import { ListingController } from './listing.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Listing, listingSchema } from './entities/listing.entity';
import { ListingRepository } from './listing.repository';
import { JwtAuthService } from 'src/common/services/jwt-auth-service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Listing.name, schema: listingSchema }]),
    UsersModule,
  ],
  controllers: [ListingController],
  providers: [ListingService, ListingRepository, JwtAuthService],
})
export class ListingModule {}
