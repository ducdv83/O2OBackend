import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VerificationsService } from './verifications.service';
import { UploadVerificationDto } from './dto/upload-verification.dto';
import { VerificationStatus, VerificationType } from './entities/verification.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('Verifications')
@Controller('verifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VerificationsController {
  constructor(private readonly verificationsService: VerificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Upload verification document' })
  async upload(
    @CurrentUser() user: User,
    @Body() dto: UploadVerificationDto,
  ) {
    return this.verificationsService.upload(user.id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user verifications' })
  async getMyVerifications(@CurrentUser() user: User) {
    return this.verificationsService.findByUser(user.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all verifications (Admin only)' })
  async findAll(@Query('status') status?: VerificationStatus) {
    return this.verificationsService.findAll(status);
  }

  @Put(':userId/:type/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve verification (Admin only)' })
  async approve(
    @Param('userId') userId: string,
    @Param('type') type: VerificationType,
  ) {
    return this.verificationsService.approve(userId, type);
  }

  @Put(':userId/:type/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject verification (Admin only)' })
  async reject(
    @Param('userId') userId: string,
    @Param('type') type: VerificationType,
  ) {
    return this.verificationsService.reject(userId, type);
  }
}
