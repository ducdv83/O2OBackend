import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsOptional, IsString, Min, Max } from 'class-validator';

export class CheckOutDto {
  @ApiProperty({ description: 'Latitude' })
  @IsNumber()
  @IsNotEmpty()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ description: 'Longitude' })
  @IsNumber()
  @IsNotEmpty()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  note?: string;
}

