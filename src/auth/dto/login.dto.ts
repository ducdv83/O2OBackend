import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: '0912345678', description: 'Số điện thoại (tên đăng nhập)' })
  @IsString()
  @MinLength(10, { message: 'Số điện thoại phải có ít nhất 10 ký tự' })
  @MaxLength(16)
  phone: string;

  @ApiProperty({ example: 'password123', description: 'Mật khẩu' })
  @IsString()
  @MinLength(1, { message: 'Vui lòng nhập mật khẩu' })
  password: string;
}
