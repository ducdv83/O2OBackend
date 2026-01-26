import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payout, PayoutStatus } from './entities/payout.entity';
import { CreatePayoutDto } from './dto/create-payout.dto';
import { User } from '../users/entities/user.entity';
import { Payment, EscrowStatus } from '../payments/entities/payment.entity';

@Injectable()
export class PayoutsService {
  constructor(
    @InjectRepository(Payout)
    private payoutsRepository: Repository<Payout>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
  ) {}

  async create(careproId: string, dto: CreatePayoutDto): Promise<Payout> {
    const carepro = await this.usersRepository.findOne({
      where: { id: careproId },
    });

    if (!carepro || carepro.role !== 'CAREPRO') {
      throw new ForbiddenException('Only CarePro users can request payouts');
    }

    // Calculate available balance (released payments)
    const availableBalance = await this.calculateAvailableBalance(careproId);

    if (dto.amount > availableBalance) {
      throw new BadRequestException('Insufficient balance');
    }

    const payout = this.payoutsRepository.create({
      user_id: careproId,
      amount: dto.amount,
      bank_info_id: dto.bank_info_id,
      status: PayoutStatus.REQUESTED,
    });

    return this.payoutsRepository.save(payout);
  }

  async findAll(careproId?: string, status?: PayoutStatus): Promise<Payout[]> {
    const where: any = {};
    if (careproId) where.user_id = careproId;
    if (status) where.status = status;

    return this.payoutsRepository.find({
      where,
      relations: ['user'],
      order: { requested_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Payout> {
    const payout = await this.payoutsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    return payout;
  }

  async process(payoutId: string, adminId: string): Promise<Payout> {
    const payout = await this.findOne(payoutId);

    if (payout.status !== PayoutStatus.REQUESTED) {
      throw new BadRequestException('Payout is not in requested status');
    }

    payout.status = PayoutStatus.PROCESSING;
    payout.processed_at = new Date();

    // TODO: Integrate with bank/payment gateway API
    // For now, simulate processing
    this.simulatePayoutProcessing(payout);

    return this.payoutsRepository.save(payout);
  }

  async approve(payoutId: string, adminId: string): Promise<Payout> {
    const payout = await this.findOne(payoutId);

    if (payout.status !== PayoutStatus.PROCESSING) {
      throw new BadRequestException('Payout is not in processing status');
    }

    payout.status = PayoutStatus.PAID;
    return this.payoutsRepository.save(payout);
  }

  async reject(payoutId: string, adminId: string, reason?: string): Promise<Payout> {
    const payout = await this.findOne(payoutId);

    if (payout.status !== PayoutStatus.PROCESSING) {
      throw new BadRequestException('Payout is not in processing status');
    }

    payout.status = PayoutStatus.FAILED;
    return this.payoutsRepository.save(payout);
  }

  /**
   * Calculate available balance for CarePro
   * (sum of released payments minus pending payouts)
   */
  private async calculateAvailableBalance(careproId: string): Promise<number> {
    // Get all released payments for this CarePro's bookings
    const bookings = await this.payoutsRepository.manager
      .createQueryBuilder()
      .select('booking.id', 'bookingId')
      .from('bookings', 'booking')
      .where('booking.carepro_id = :careproId', { careproId })
      .getRawMany();

    const bookingIds = bookings.map((b) => b.bookingId);

    if (bookingIds.length === 0) return 0;

    const releasedPayments = await this.paymentsRepository
      .createQueryBuilder('payment')
      .where('payment.booking_id IN (:...bookingIds)', { bookingIds })
      .andWhere('payment.escrow_status = :status', {
        status: EscrowStatus.RELEASED,
      })
      .getMany();

    const totalReleased = releasedPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );

    // Subtract pending/processing payouts
    const pendingPayouts = await this.payoutsRepository
      .createQueryBuilder('payout')
      .where('payout.user_id = :careproId', { careproId })
      .andWhere('payout.status IN (:...statuses)', {
        statuses: [PayoutStatus.REQUESTED, PayoutStatus.PROCESSING],
      })
      .getMany();

    const totalPending = pendingPayouts.reduce(
      (sum, payout) => sum + payout.amount,
      0,
    );

    return Math.max(0, totalReleased - totalPending);
  }

  private async simulatePayoutProcessing(payout: Payout): Promise<void> {
    // Simulate async processing
    setTimeout(() => {
      // In real implementation, this would be a webhook from bank/payment gateway
      this.payoutsRepository.update(payout.id, {
        status: PayoutStatus.PAID,
      });
    }, 5000);
  }
}
