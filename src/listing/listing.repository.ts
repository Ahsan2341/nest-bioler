import { Injectable } from '@nestjs/common';
import { GenericRepository } from 'src/common/repositories/generic.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Listing, ListingDocument } from './entities/listing.entity';

@Injectable()
export class ListingRepository extends GenericRepository<ListingDocument> {
  constructor(
    @InjectModel(Listing.name) readonly listingModel: Model<ListingDocument>,
  ) {
    super(listingModel);
  }
}
