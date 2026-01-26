import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsPhoneNumber } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({ example: '+84901234567' })
  @IsString()
  @IsPhoneNumber('VN')
  phone: string;
}

