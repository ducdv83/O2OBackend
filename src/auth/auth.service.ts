import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { OtpService } from '../otp/otp.service';
import { JwtPayload } from '../common/interfaces/user.interface';
import { RegisterDto } from './dto/register.dto';

/** Chuẩn hóa SĐT VN: bỏ ký tự không phải số, thống nhất dạng 0xxxxxxxxx */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 9 && digits.startsWith('9')) {
    return '0' + digits;
  }
  return digits.startsWith('0') ? digits : digits;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private otpService: OtpService,
  ) {}

  /** Đăng ký CarePro: phone + password + full_name, email, gender, address. Trả về JWT + user. */
  async register(dto: RegisterDto) {
    const normalized = normalizePhone(dto.phone);
    const altPhone = normalized.startsWith('0') ? normalized.slice(1) : normalized;
    const existing = await this.usersRepository.findOne({
      where: [{ phone: normalized }, { phone: altPhone }],
    });
    if (existing) {
      throw new BadRequestException('Số điện thoại này đã được đăng ký.');
    }
    const password_hash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      phone: normalized,
      password_hash,
      role: 'CAREPRO' as any,
      full_name: dto.full_name,
      email: dto.email ?? undefined,
      gender: dto.gender ?? undefined,
      address: dto.address ?? undefined,
    });
    await this.usersRepository.save(user);
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

  /** Đăng nhập: phone + password. Trả về JWT + user. */
  async login(phone: string, password: string) {
    const normalized = normalizePhone(phone);
    const altPhone = normalized.startsWith('0') ? normalized.slice(1) : normalized;
    const user = await this.usersRepository.findOne({
      where: [{ phone: normalized }, { phone: altPhone }],
    });
    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại.');
    }
    if (!user.password_hash) {
      throw new UnauthorizedException('Tài khoản chưa đặt mật khẩu. Vui lòng dùng cách đăng nhập khác.');
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      throw new UnauthorizedException('Sai mật khẩu.');
    }
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

  /** Kiểm tra SĐT đã tồn tại trong DB (dùng cho đăng ký CarePro để báo lỗi). */
  async checkPhoneExists(phone: string): Promise<{ exists: boolean }> {
    const normalized = normalizePhone(phone);
    const altPhone = normalized.startsWith('0') ? normalized.slice(1) : normalized;
    const user = await this.usersRepository.findOne({
      where: [{ phone: normalized }, { phone: altPhone }],
    });
    return { exists: !!user };
  }

  async requestOtp(phone: string) {
    const normalized = normalizePhone(phone);
    const requestId = await this.otpService.generateOtp(normalized);
    return { request_id: requestId };
  }

  async verifyOtp(requestId: string, otp: string, role?: string) {
    const phone = await this.otpService.getPhoneFromRequestId(requestId);
    if (!phone) {
      throw new UnauthorizedException('Invalid request ID');
    }

    const isValid = await this.otpService.verifyOtp(requestId, otp);
    if (!isValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    const normalized = normalizePhone(phone);
    // Tìm user theo số đã chuẩn hóa hoặc dạng 9 số (tương thích dữ liệu cũ)
    const altPhone = normalized.startsWith('0') ? normalized.slice(1) : normalized;
    let user = await this.usersRepository.findOne({
      where: [{ phone: normalized }, { phone: altPhone }],
    });
    const isNewUser = !user;
    if (!user) {
      user = this.usersRepository.create({
        phone: normalized,
        role: (role as any) || 'CLIENT',
      });
      await this.usersRepository.save(user);
    }

    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role as any,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      is_new_user: isNewUser,
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

