import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentMethod, EscrowStatus } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { EscrowService } from './escrow.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    private escrowService: EscrowService,
  ) {}

  async create(dto: CreatePaymentDto, clientId: string): Promise<Payment> {
    const booking = await this.bookingsRepository.findOne({
      where: { id: dto.booking_id },
      relations: ['job'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.job.client_id !== clientId) {
      throw new ForbiddenException('Only booking owner can create payment');
    }

    if (booking.status !== BookingStatus.SCHEDULED) {
      throw new BadRequestException('Payment can only be created for scheduled bookings');
    }

    // Check for existing payment
    const existing = await this.paymentsRepository.findOne({
      where: { booking_id: dto.booking_id },
    });

    if (existing) {
      throw new BadRequestException('Payment already exists for this booking');
    }

    // Create payment with escrow
    const payment = this.paymentsRepository.create({
      booking_id: dto.booking_id,
      amount: dto.amount,
      method: dto.method,
      escrow_status: EscrowStatus.HELD,
    });

    // Hold money in escrow
    await this.escrowService.holdPayment(payment.id, dto.amount);

    return this.paymentsRepository.save(payment);
  }

  async findAll(bookingId?: string): Promise<Payment[]> {
    const where = bookingId ? { booking_id: bookingId } : {};
    return this.paymentsRepository.find({
      where,
      relations: ['booking'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({
      where: { id },
      relations: ['booking'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async release(paymentId: string, adminId?: string): Promise<Payment> {
    const payment = await this.findOne(paymentId);

    if (payment.escrow_status !== EscrowStatus.HELD) {
      throw new BadRequestException('Payment is not in escrow');
    }

    // Release money from escrow
    await this.escrowService.releasePayment(payment.id, payment.amount);

    payment.escrow_status = EscrowStatus.RELEASED;
    return this.paymentsRepository.save(payment);
  }

  async refund(paymentId: string, amount?: number, adminId?: string): Promise<Payment> {
    const payment = await this.findOne(paymentId);

    if (payment.escrow_status !== EscrowStatus.HELD) {
      throw new BadRequestException('Payment is not in escrow');
    }

    const refundAmount = amount || payment.amount;

    // Refund money
    await this.escrowService.refundPayment(payment.id, refundAmount);

    payment.escrow_status = EscrowStatus.REFUNDED;
    return this.paymentsRepository.save(payment);
  }
}
