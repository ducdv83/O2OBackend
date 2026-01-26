import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TimesheetsService } from './timesheets.service';
import { CheckInDto } from './dto/checkin.dto';
import { CheckOutDto } from './dto/checkout.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Timesheets')
@Controller('bookings/:bookingId/timesheet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TimesheetsController {
  constructor(private readonly timesheetsService: TimesheetsService) {}

  @Post('checkin')
  @ApiOperation({ summary: 'Check in for booking (CarePro only)' })
  async checkIn(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: User,
    @Body() dto: CheckInDto,
  ) {
    return this.timesheetsService.checkIn(bookingId, user.id, dto);
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Check out for booking (CarePro only)' })
  async checkOut(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: User,
    @Body() dto: CheckOutDto,
  ) {
    return this.timesheetsService.checkOut(bookingId, user.id, dto);
  }

  @Put('confirm')
  @ApiOperation({ summary: 'Confirm timesheet (Client only)' })
  async confirm(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: User,
  ) {
    return this.timesheetsService.confirm(user.id, bookingId);
  }

  @Get()
  @ApiOperation({ summary: 'Get timesheet for booking' })
  async findOne(@Param('bookingId') bookingId: string) {
    return this.timesheetsService.findOne(bookingId);
  }
}
