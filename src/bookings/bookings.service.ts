import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Job, JobStatus } from '../jobs/entities/job.entity';
import { User } from '../users/entities/user.entity';
import { Proposal, ProposalStatus } from '../proposals/entities/proposal.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(Job)
    private jobsRepository: Repository<Job>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Proposal)
    private proposalsRepository: Repository<Proposal>,
  ) {}

  async create(dto: CreateBookingDto, clientId: string): Promise<Booking> {
    const job = await this.jobsRepository.findOne({
      where: { id: dto.job_id },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.client_id !== clientId) {
      throw new ForbiddenException('Only job owner can create bookings');
    }

    if (job.status !== JobStatus.OPEN && job.status !== JobStatus.BOOKED) {
      throw new BadRequestException('Job is not available for booking');
    }

    const carepro = await this.usersRepository.findOne({
      where: { id: dto.carepro_id },
    });

    if (!carepro || carepro.role !== 'CAREPRO') {
      throw new NotFoundException('CarePro not found');
    }

    // Check if there's an accepted proposal
    const proposal = await this.proposalsRepository.findOne({
      where: {
        job_id: dto.job_id,
        carepro_id: dto.carepro_id,
        status: ProposalStatus.ACCEPTED,
      },
    });

    if (!proposal) {
      throw new BadRequestException('No accepted proposal found for this job and CarePro');
    }

    // Check for existing booking
    const existing = await this.bookingsRepository
      .createQueryBuilder('booking')
      .where('booking.job_id = :jobId', { jobId: dto.job_id })
      .andWhere('booking.carepro_id = :careproId', { careproId: dto.carepro_id })
      .andWhere('booking.status != :status', { status: BookingStatus.CANCELLED })
      .getOne();

    if (existing) {
      throw new BadRequestException('Booking already exists for this job');
    }

    const booking = this.bookingsRepository.create({
      job_id: dto.job_id,
      carepro_id: dto.carepro_id,
      agreed_rate: dto.agreed_rate,
      start_time: new Date(dto.start_time),
      end_time: new Date(dto.end_time),
      status: BookingStatus.SCHEDULED,
    });

    // Update job status
    job.status = JobStatus.BOOKED;
    await this.jobsRepository.save(job);

    return this.bookingsRepository.save(booking);
  }

  async findAll(userId?: string, status?: BookingStatus): Promise<Booking[]> {
    const query = this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.job', 'job')
      .leftJoinAndSelect('booking.carepro', 'carepro')
      .leftJoinAndSelect('job.client', 'client');

    if (status) {
      query.where('booking.status = :status', { status });
    }

    if (userId) {
      if (status) {
        query.andWhere(
          '(booking.carepro_id = :userId OR job.client_id = :userId)',
          { userId },
        );
      } else {
        query.where(
          '(booking.carepro_id = :userId OR job.client_id = :userId)',
          { userId },
        );
      }
    }

    return query.orderBy('booking.start_time', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: ['job', 'carepro', 'timesheet', 'payments', 'reviews'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async start(id: string, careproId: string): Promise<Booking> {
    const booking = await this.findOne(id);

    if (booking.carepro_id !== careproId) {
      throw new ForbiddenException('Only assigned CarePro can start booking');
    }

    if (booking.status !== BookingStatus.SCHEDULED) {
      throw new BadRequestException('Booking cannot be started');
    }

    booking.status = BookingStatus.IN_PROGRESS;
    return this.bookingsRepository.save(booking);
  }

  async complete(id: string, careproId: string): Promise<Booking> {
    const booking = await this.findOne(id);

    if (booking.carepro_id !== careproId) {
      throw new ForbiddenException('Only assigned CarePro can complete booking');
    }

    if (booking.status !== BookingStatus.IN_PROGRESS) {
      throw new BadRequestException('Booking is not in progress');
    }

    booking.status = BookingStatus.COMPLETED;

    // Update job status
    booking.job.status = JobStatus.DONE;
    await this.jobsRepository.save(booking.job);

    return this.bookingsRepository.save(booking);
  }

  async cancel(id: string, userId: string, reason?: string): Promise<Booking> {
    const booking = await this.findOne(id);

    const isClient = booking.job.client_id === userId;
    const isCarepro = booking.carepro_id === userId;

    if (!isClient && !isCarepro) {
      throw new ForbiddenException('Only client or CarePro can cancel booking');
    }

    if (
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.CANCELLED
    ) {
      throw new BadRequestException('Booking cannot be cancelled');
    }

    const wasScheduled = booking.status === BookingStatus.SCHEDULED;
    booking.status = BookingStatus.CANCELLED;

    // Update job status back to OPEN if cancelled before start
    if (wasScheduled) {
      booking.job.status = JobStatus.OPEN;
      await this.jobsRepository.save(booking.job);
    }

    return this.bookingsRepository.save(booking);
  }
}
