import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dispute, DisputeStatus } from './entities/dispute.entity';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { Payment, EscrowStatus } from '../payments/entities/payment.entity';
import { EscrowService } from '../payments/escrow.service';

@Injectable()
export class DisputesService {
  constructor(
    @InjectRepository(Dispute)
    private disputesRepository: Repository<Dispute>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    private escrowService: EscrowService,
  ) {}

  async create(userId: string, dto: CreateDisputeDto): Promise<Dispute> {
    const booking = await this.bookingsRepository.findOne({
      where: { id: dto.booking_id },
      relations: ['carepro', 'job'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify user is part of this booking
    const isClient = booking.job.client_id === userId;
    const isCarepro = booking.carepro_id === userId;

    if (!isClient && !isCarepro) {
      throw new ForbiddenException('You are not part of this booking');
    }

    // Check for existing open dispute
    const existing = await this.disputesRepository.findOne({
      where: {
        booking_id: dto.booking_id,
        status: DisputeStatus.OPEN,
      },
    });

    if (existing) {
      throw new BadRequestException('Dispute already exists for this booking');
    }

    const dispute = this.disputesRepository.create({
      booking_id: dto.booking_id,
      opened_by: userId,
      reason: dto.reason,
      evidence_urls: dto.evidence_urls || [],
      status: DisputeStatus.OPEN,
    });

    // Hold payment if not already held
    const payment = await this.paymentsRepository.findOne({
      where: { booking_id: dto.booking_id },
    });

    if (payment && payment.escrow_status !== EscrowStatus.HELD) {
      // Payment should already be in escrow, but ensure it is
      await this.escrowService.holdPayment(payment.id, payment.amount);
    }

    return this.disputesRepository.save(dispute);
  }

  async findAll(status?: DisputeStatus): Promise<Dispute[]> {
    const where = status ? { status } : {};
    return this.disputesRepository.find({
      where,
      relations: ['booking', 'openedBy'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Dispute> {
    const dispute = await this.disputesRepository.findOne({
      where: { id },
      relations: ['booking', 'openedBy'],
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    return dispute;
  }

  async resolve(
    disputeId: string,
    adminId: string,
    dto: ResolveDisputeDto,
  ): Promise<Dispute> {
    const dispute = await this.findOne(disputeId);

    if (dispute.status !== DisputeStatus.OPEN) {
      throw new BadRequestException('Dispute is not open');
    }

    const payment = await this.paymentsRepository.findOne({
      where: { booking_id: dispute.booking_id },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found for this booking');
    }

    // Resolve dispute based on resolution type
    switch (dto.resolution) {
      case 'REFUND':
        // Full refund to client
        await this.escrowService.refundPayment(payment.id, payment.amount);
        payment.escrow_status = EscrowStatus.REFUNDED;
        break;

      case 'PARTIAL':
        // Partial refund (50% to each party)
        const partialAmount = Math.round(payment.amount / 2);
        await this.escrowService.refundPayment(payment.id, partialAmount);
        await this.escrowService.releasePayment(payment.id, partialAmount);
        payment.escrow_status = EscrowStatus.RELEASED;
        break;

      case 'RELEASE':
        // Release to CarePro
        await this.escrowService.releasePayment(payment.id, payment.amount);
        payment.escrow_status = EscrowStatus.RELEASED;
        break;
    }

    await this.paymentsRepository.save(payment);

    dispute.status = DisputeStatus.RESOLVED;
    return this.disputesRepository.save(dispute);
  }

  async reject(disputeId: string, adminId: string, reason?: string): Promise<Dispute> {
    const dispute = await this.findOne(disputeId);

    if (dispute.status !== DisputeStatus.OPEN) {
      throw new BadRequestException('Dispute is not open');
    }

    dispute.status = DisputeStatus.REJECTED;
    return this.disputesRepository.save(dispute);
  }
}
