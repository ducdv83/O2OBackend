import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name);

  constructor(private configService: ConfigService) {}

  async sendOtp(phone: string, otp: string): Promise<void> {
    const provider = this.configService.get<string>('SMS_PROVIDER', 'mock');

    if (provider === 'mock') {
      // In development, just log the OTP
      this.logger.log(`[MOCK SMS] OTP for ${phone}: ${otp}`);
      return;
    }

    // TODO: Integrate with real SMS gateway (Twilio, AWS SNS, etc.)
    // For now, we'll use mock
    this.logger.log(`[SMS] OTP for ${phone}: ${otp}`);
  }
}

