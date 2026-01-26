import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  job_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  carepro_id: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  agreed_rate: number;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  start_time: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  end_time: string;
}

