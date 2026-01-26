import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export enum DisputeResolution {
  REFUND = 'REFUND',
  PARTIAL = 'PARTIAL',
  RELEASE = 'RELEASE',
}

export class ResolveDisputeDto {
  @ApiProperty({ enum: DisputeResolution })
  @IsEnum(DisputeResolution)
  @IsNotEmpty()
  resolution: DisputeResolution;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  note?: string;
}

