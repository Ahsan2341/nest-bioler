import { IsString, IsNumber, Min, IsArray, IsDateString, IsMongoId } from 'class-validator';

export class CreateListingDto {
  @IsString()
  propertyTitle: string;

  @IsString()
  propertyType: string;

  @IsString()
  address: string;

  @IsNumber()
  @Min(1)
  bedrooms: number;

  @IsNumber()
  @Min(1)
  bathrooms: number;

  @IsNumber()
  area: number;

  @IsNumber()
  @Min(0)
  monthlyRent: number;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  photos: string[];

  @IsArray()
  @IsString({ each: true })
  features: string[];

  @IsDateString()
  availableFrom: string;
}