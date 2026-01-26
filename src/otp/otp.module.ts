import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { SmsProvider } from './providers/sms.provider';

@Module({
  providers: [OtpService, SmsProvider],
  exports: [OtpService],
})
export class OtpModule {}

