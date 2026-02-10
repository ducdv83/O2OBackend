import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsEmail, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: '0912345678', description: 'Số điện thoại (tên đăng nhập)' })
  @IsString()
  @MinLength(10, { message: 'Số điện thoại phải có ít nhất 10 ký tự' })
  @MaxLength(16)
  phone: string;

  @ApiProperty({ example: 'password123', description: 'Mật khẩu' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ và tên' })
  @IsString()
  @MinLength(2, { message: 'Họ và tên phải có ít nhất 2 ký tự' })
  @MaxLength(255)
  full_name: string;

  @ApiPropertyOptional({ example: 'user@example.com', description: 'Email' })
  @IsOptional()
  @IsString()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: 'male', description: 'Giới tính: male | female | other' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  gender?: string;

  @ApiPropertyOptional({ example: '123 Đường ABC, Quận 1, TP.HCM', description: 'Địa chỉ' })
  @IsOptional()
  @IsString()
  address?: string;
}
