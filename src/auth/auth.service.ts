import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { OtpService } from '../otp/otp.service';
import { JwtPayload } from '../common/interfaces/user.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private otpService: OtpService,
  ) {}

  async requestOtp(phone: string) {
    const requestId = await this.otpService.generateOtp(phone);
    return { request_id: requestId };
  }

  async verifyOtp(requestId: string, otp: string, role?: string) {
    const isValid = await this.otpService.verifyOtp(requestId, otp);
    if (!isValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    const phone = await this.otpService.getPhoneFromRequestId(requestId);
    if (!phone) {
      throw new UnauthorizedException('Invalid request ID');
    }

    // Find or create user
    let user = await this.usersRepository.findOne({ where: { phone } });
    if (!user) {
      user = this.usersRepository.create({
        phone,
        role: (role as any) || 'CLIENT', // Default role, can be changed during registration
      });
      await this.usersRepository.save(user);
    }

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role as any,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        full_name: user.full_name,
        email: user.email,
      },
    };
  }

  async logout(userId: string) {
    // In a real implementation, you might want to blacklist the token
    // For now, we'll just return success
    return { message: 'Logged out successfully' };
  }

  async validateUser(payload: JwtPayload): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}

