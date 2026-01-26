import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  booking_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  body: string;
}

