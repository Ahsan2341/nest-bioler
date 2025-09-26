import { Injectable } from '@nestjs/common';
import { GenericService } from 'src/common/services/generic.service';
import { ListingRepository } from './listing.repository';

@Injectable()
export class ListingService extends GenericService {
  constructor(public readonly repository: ListingRepository) {
    super(repository);
  }
}
