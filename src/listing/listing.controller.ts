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
    @Query() params,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const user = request.user;
    const filters = {
      ...Object.fromEntries(
        Object.entries(params).filter(
          ([key]) => !['page', 'limit', "minPrice", "maxPrice", "myListing", "location"].includes(key),
        ),
      ),
      ...(params.minPrice && !params.maxPrice && { monthlyRent: { $gte: Number(params.minPrice) } }),
      ...(params.maxPrice && !params.minPrice && { monthlyRent: { ...(params.minPrice && { $gte: Number(params.minPrice) }), $lte: Number(params.maxPrice) } }),
      ...(params.maxPrice && params.minPrice && { monthlyRent: { ...(params.minPrice && { $gte: Number(params.minPrice) }), $lte: Number(params.maxPrice) } }),
      ...(params.myListing && {user:user._id}),
      ...(params.amenities && { amenities: { $in: params.amenities.split(",").map(item => item.trim()) }}),
      ...(params.availableFrom && { availableFrom: { $lte: new Date() } }),
      ...(params.location && { address: { $regex: params.location, $options: 'i' } })
    };
    console.log(filters);
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.listingService.findAll(filters, pageNum, limitNum);
  }
}
