import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNotEmpty, IsUrl } from 'class-validator';
import { VerificationType } from '../entities/verification.entity';

export class UploadVerificationDto {
  @ApiProperty({ enum: VerificationType })
  @IsEnum(VerificationType)
  @IsNotEmpty()
  type: VerificationType;

  @ApiProperty()
  @IsString()
  @IsUrl()
  @IsNotEmpty()
  file_url: string;
}

