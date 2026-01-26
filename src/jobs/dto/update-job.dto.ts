import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  IsEnum,
  Min,
} from 'class-validator';
import { JobStatus } from '../entities/job.entity';

export class UpdateJobDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  service_type?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  start_time?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  end_time?: string;

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

  @ApiProperty({ enum: JobStatus, required: false })
  @IsEnum(JobStatus)
  @IsOptional()
  status?: JobStatus;
}

