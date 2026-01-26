import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator';

export class CreateProposalDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  job_id: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  proposed_rate: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  message?: string;
}

