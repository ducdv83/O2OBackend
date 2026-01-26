import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsArray, Min, Max } from 'class-validator';

export class CreateCareproDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ required: false, minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  years_exp?: number;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certificates?: string[];

  @ApiProperty({ required: false, minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  hourly_rate_hint?: number;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  service_types?: string[];
}

