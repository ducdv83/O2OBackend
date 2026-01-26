import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsDateString,
  IsObject,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  lng: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;
}

export class CreateJobDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  service_type: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: LocationDto })
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  start_time: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  end_time: string;

  @ApiProperty({ required: false, minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  budget_min?: number;

  @ApiProperty({ required: false, minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  budget_max?: number;
}

