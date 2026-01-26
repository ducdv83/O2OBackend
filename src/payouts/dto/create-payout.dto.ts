import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, IsEnum, Min } from 'class-validator';

export enum PayoutChannel {
  BANK = 'bank',
  MOMO = 'momo',
  ZALOPAY = 'zalopay',
}

export class CreatePayoutDto {
  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ enum: PayoutChannel })
  @IsEnum(PayoutChannel)
  @IsNotEmpty()
  channel: PayoutChannel;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bank_info_id: string;
}

