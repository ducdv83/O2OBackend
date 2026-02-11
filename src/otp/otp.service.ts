import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsProvider } from './providers/sms.provider';
import { v4 as uuidv4 } from 'uuid';

interface OtpRequest {
  requestId: string;
  phone: string;
  otp: string;
  expiresAt: Date;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private otpStore: Map<string, OtpRequest> = new Map();
  private phoneToRequestId: Map<string, string> = new Map();

  constructor(
    private configService: ConfigService,
    private smsProvider: SmsProvider,
  ) {}

  async generateOtp(phone: string): Promise<string> {
    const fixedOtpRaw = this.configService.get<string>('OTP_FIXED');
    const fixedOtp = fixedOtpRaw ? fixedOtpRaw.trim() : '';

    // Rate limiting check
    const existingRequestId = this.phoneToRequestId.get(phone);
    if (existingRequestId) {
      const existingRequest = this.otpStore.get(existingRequestId);
      if (existingRequest && new Date() < existingRequest.expiresAt) {
        const timeLeft = Math.floor(
          (existingRequest.expiresAt.getTime() - new Date().getTime()) / 1000,
        );
        // Dev: reuse active request when OTP is fixed
        if (fixedOtp) {
          return existingRequestId;
        }
        if (timeLeft > 240) {
          // Can only request new OTP after 1 minute
          throw new BadRequestException('Please wait before requesting a new OTP');
        }
      }
    }

    const requestId = uuidv4();
    const otpLength = this.configService.get<number>('OTP_LENGTH', 6);
    const otpExpiresIn = this.configService.get<number>('OTP_EXPIRES_IN', 300); // 5 minutes

    // Generate 6-digit OTP
    const otp =
      fixedOtp && fixedOtp.length > 0
        ? fixedOtp
        : Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + otpExpiresIn);

    const otpRequest: OtpRequest = {
      requestId,
      phone,
      otp,
      expiresAt,
    };

    this.otpStore.set(requestId, otpRequest);
    this.phoneToRequestId.set(phone, requestId);

    // Log OTP for dev visibility
    this.logger.log(`[OTP] phone=${phone} requestId=${requestId} otp=${otp}`);

    // Send OTP via SMS (mock in development)
    await this.smsProvider.sendOtp(phone, otp);

    // Clean up expired OTPs
    this.cleanupExpiredOtps();

    return requestId;
  }

  async verifyOtp(requestId: string, otp: string): Promise<boolean> {
    const otpRequest = this.otpStore.get(requestId);

    if (!otpRequest) {
      return false;
    }

    if (new Date() > otpRequest.expiresAt) {
      this.otpStore.delete(requestId);
      return false;
    }

    if (otpRequest.otp !== otp) {
      return false;
    }

    // OTP verified, remove it
    this.otpStore.delete(requestId);
    this.phoneToRequestId.delete(otpRequest.phone);

    return true;
  }

  async getPhoneFromRequestId(requestId: string): Promise<string | null> {
    const otpRequest = this.otpStore.get(requestId);
    return otpRequest?.phone || null;
  }

  private cleanupExpiredOtps() {
    const now = new Date();
    for (const [requestId, otpRequest] of this.otpStore.entries()) {
      if (now > otpRequest.expiresAt) {
        this.otpStore.delete(requestId);
        this.phoneToRequestId.delete(otpRequest.phone);
      }
    }
  }
}

