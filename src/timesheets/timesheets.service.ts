import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Timesheet } from './entities/timesheet.entity';
import { CheckInDto } from './dto/checkin.dto';
import { CheckOutDto } from './dto/checkout.dto';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';

@Injectable()
export class TimesheetsService {
  constructor(
    @InjectRepository(Timesheet)
    private timesheetsRepository: Repository<Timesheet>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
  ) {}

  async checkIn(bookingId: string, careproId: string, dto: CheckInDto): Promise<Timesheet> {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.carepro_id !== careproId) {
      throw new ForbiddenException('Only assigned CarePro can check in');
    }

    if (booking.status !== BookingStatus.SCHEDULED && booking.status !== BookingStatus.IN_PROGRESS) {
      throw new BadRequestException('Cannot check in for this booking');
    }

    let timesheet = await this.timesheetsRepository.findOne({
      where: { booking_id: bookingId },
    });

    if (timesheet && timesheet.checkin_at) {
      throw new BadRequestException('Already checked in');
    }

    if (!timesheet) {
      timesheet = this.timesheetsRepository.create({
        booking_id: bookingId,
      });
    }

    timesheet.checkin_at = new Date();
    timesheet.gps_checkin = `POINT(${dto.lng} ${dto.lat})`;

    // Validate check-in location (should be near job location)
    const isValidLocation = await this.validateLocation(
      booking.job.location_point,
      dto.lat,
      dto.lng,
      100, // 100 meters radius
    );

    if (!isValidLocation) {
      throw new BadRequestException('Check-in location is too far from job location');
    }

    // Update booking status to IN_PROGRESS
    if (booking.status === BookingStatus.SCHEDULED) {
      booking.status = BookingStatus.IN_PROGRESS;
      await this.bookingsRepository.save(booking);
    }

    return this.timesheetsRepository.save(timesheet);
  }

  async checkOut(bookingId: string, careproId: string, dto: CheckOutDto): Promise<Timesheet> {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.carepro_id !== careproId) {
      throw new ForbiddenException('Only assigned CarePro can check out');
    }

    if (booking.status !== BookingStatus.IN_PROGRESS) {
      throw new BadRequestException('Booking is not in progress');
    }

    const timesheet = await this.timesheetsRepository.findOne({
      where: { booking_id: bookingId },
    });

    if (!timesheet || !timesheet.checkin_at) {
      throw new BadRequestException('Must check in before checking out');
    }

    if (timesheet.checkout_at) {
      throw new BadRequestException('Already checked out');
    }

    timesheet.checkout_at = new Date();
    timesheet.gps_checkout = `POINT(${dto.lng} ${dto.lat})`;

    // Calculate hours worked
    const hours = (timesheet.checkout_at.getTime() - timesheet.checkin_at.getTime()) / (1000 * 60 * 60);
    timesheet.hours = Math.round(hours * 100) / 100;

    return this.timesheetsRepository.save(timesheet);
  }

  async confirm(clientId: string, bookingId: string): Promise<Timesheet> {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.job.client_id !== clientId) {
      throw new ForbiddenException('Only client can confirm timesheet');
    }

    const timesheet = await this.timesheetsRepository.findOne({
      where: { booking_id: bookingId },
    });

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    if (!timesheet.checkout_at) {
      throw new BadRequestException('Cannot confirm timesheet without checkout');
    }

    timesheet.client_confirmed = true;
    return this.timesheetsRepository.save(timesheet);
  }

  async findOne(bookingId: string): Promise<Timesheet> {
    const timesheet = await this.timesheetsRepository.findOne({
      where: { booking_id: bookingId },
      relations: ['booking'],
    });

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    return timesheet;
  }

  /**
   * Validate if check-in/out location is within radius of job location
   */
  private async validateLocation(
    jobLocation: string,
    lat: number,
    lng: number,
    radiusMeters: number,
  ): Promise<boolean> {
    // Simplified validation - in production, use PostGIS ST_DWithin
    // For now, return true (always valid)
    // TODO: Implement proper PostGIS distance calculation
    return true;
  }
}
