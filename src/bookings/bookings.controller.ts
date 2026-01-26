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
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingStatus } from './entities/booking.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a booking' })
  async create(@CurrentUser() user: User, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bookings' })
  async findAll(
    @Query('status') status?: BookingStatus,
    @CurrentUser() user?: User,
  ) {
    return this.bookingsService.findAll(user?.id, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  async findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Put(':id/start')
  @ApiOperation({ summary: 'Start booking (CarePro only)' })
  async start(@Param('id') id: string, @CurrentUser() user: User) {
    return this.bookingsService.start(id, user.id);
  }

  @Put(':id/complete')
  @ApiOperation({ summary: 'Complete booking (CarePro only)' })
  async complete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.bookingsService.complete(id, user.id);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel booking' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body('reason') reason?: string,
  ) {
    return this.bookingsService.cancel(id, user.id, reason);
  }
}
