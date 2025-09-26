import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ListingService } from './listing.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { JwtGuards } from 'src/common/guards/jwt-guards';

@Controller('listing')
export class ListingController {
  constructor(private readonly listingService: ListingService) {}
  @UseGuards(JwtGuards)
  @Post()
  create(@Body() createListingDto: CreateListingDto, @Request() request) {
    const user = request.user;
    console.log(createListingDto);
    return this.listingService.create({ ...createListingDto, user: user._id });
  }
  @UseGuards(JwtGuards)
  @Get()
  findAll(
    @Request() request,
    @Query() Params,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const user = request.user;
    const filters={...Params, user:user._id}
    console.log(filters)
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.listingService.findAll(filters, pageNum, limitNum);
  }
}
