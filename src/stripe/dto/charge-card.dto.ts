import { IsNumber, IsOptional, Min, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MetadataDto {
  @IsOptional()
  reason?: string;
}

export class ChargeCardDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MetadataDto)
  metadata?: MetadataDto;
}