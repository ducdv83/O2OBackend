import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { Job, JobStatus } from '../jobs/entities/job.entity';
import { Payment, EscrowStatus } from '../payments/entities/payment.entity';
import { Dispute, DisputeStatus } from '../disputes/entities/dispute.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CareproProfile } from '../carepro/entities/carepro-profile.entity';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(Job)
    private jobsRepository: Repository<Job>,
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Dispute)
    private disputesRepository: Repository<Dispute>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(CareproProfile)
    private careproRepository: Repository<CareproProfile>,
  ) {}

  async getDashboardStats(): Promise<DashboardStatsDto> {
    // GMV (Gross Merchandise Value)
    const allPayments = await this.paymentsRepository.find({
      where: { escrow_status: EscrowStatus.RELEASED },
    });
    const gmv = allPayments.reduce((sum, payment) => sum + payment.amount, 0);

    // Bookings stats
    const totalBookings = await this.bookingsRepository.count();
    const completedBookings = await this.bookingsRepository.count({
      where: { status: BookingStatus.COMPLETED },
    });
    const cancelledBookings = await this.bookingsRepository.count({
      where: { status: BookingStatus.CANCELLED },
    });
    const cancellationRate =
      totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

    // Disputes stats
    const totalDisputes = await this.disputesRepository.count();
    const openDisputes = await this.disputesRepository.count({
      where: { status: DisputeStatus.OPEN },
    });

    // Users stats
    const totalCarePros = await this.usersRepository.count({
      where: { role: UserRole.CAREPRO },
    });
    const verifiedCarePros = await this.careproRepository
      .createQueryBuilder('carepro')
      .where('carepro.verified_level > :level', { level: 0 })
      .getCount();
    const totalClients = await this.usersRepository.count({
      where: { role: UserRole.CLIENT },
    });

    // Jobs stats
    const activeJobs = await this.jobsRepository.count({
      where: { status: JobStatus.OPEN },
    });

    return {
      gmv,
      totalBookings,
      completedBookings,
      cancelledBookings,
      cancellationRate: Math.round(cancellationRate * 100) / 100,
      totalDisputes,
      openDisputes,
      totalCarePros,
      verifiedCarePros,
      totalClients,
      activeJobs,
    };
  }
}
