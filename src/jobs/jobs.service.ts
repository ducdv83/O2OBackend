import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Job, JobStatus } from './entities/job.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private jobsRepository: Repository<Job>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(userId: string, dto: CreateJobDto): Promise<Job> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'CLIENT') {
      throw new ForbiddenException('Only clients can create jobs');
    }

    // Convert location to PostGIS POINT format
    const locationPoint = `POINT(${dto.location.lng} ${dto.location.lat})`;

    const job = this.jobsRepository.create({
      client_id: userId,
      service_type: dto.service_type,
      description: dto.description,
      location_point: locationPoint,
      address: dto.location.address,
      start_time: new Date(dto.start_time),
      end_time: new Date(dto.end_time),
      budget_min: dto.budget_min,
      budget_max: dto.budget_max,
      status: JobStatus.DRAFT,
    });

    return this.jobsRepository.save(job);
  }

  async findAll(
    status?: JobStatus,
    serviceType?: string,
    search?: string,
  ): Promise<Job[]> {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (serviceType) {
      where.service_type = serviceType;
    }

    const query = this.jobsRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.client', 'client');

    if (Object.keys(where).length > 0) {
      query.where(where);
    }

    if (search) {
      query.andWhere('job.description ILIKE :search', {
        search: `%${search}%`,
      });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Job> {
    const job = await this.jobsRepository.findOne({
      where: { id },
      relations: ['client', 'proposals', 'bookings'],
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async findByClient(clientId: string): Promise<Job[]> {
    return this.jobsRepository.find({
      where: { client_id: clientId },
      relations: ['proposals', 'bookings'],
      order: { created_at: 'DESC' },
    });
  }

  async findNearby(
    lat: number,
    lng: number,
    radiusKm: number = 10,
  ): Promise<Job[]> {
    // Find jobs within radius using PostGIS
    const query = this.jobsRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.client', 'client')
      .where(
        `ST_DWithin(
          job.location_point::geography,
          ST_MakePoint(:lng, :lat)::geography,
          :radius
        )`,
        { lng, lat, radius: radiusKm * 1000 }, // radius in meters
      )
      .andWhere('job.status = :status', { status: JobStatus.OPEN });

    return query.getMany();
  }

  async update(id: string, userId: string, dto: UpdateJobDto): Promise<Job> {
    const job = await this.findOne(id);

    if (job.client_id !== userId) {
      throw new ForbiddenException('You can only update your own jobs');
    }

    if (job.status !== JobStatus.DRAFT && job.status !== JobStatus.OPEN) {
      throw new BadRequestException('Cannot update job in current status');
    }

    Object.assign(job, dto);
    return this.jobsRepository.save(job);
  }

  async publish(id: string, userId: string): Promise<Job> {
    const job = await this.findOne(id);

    if (job.client_id !== userId) {
      throw new ForbiddenException('You can only publish your own jobs');
    }

    if (job.status !== JobStatus.DRAFT) {
      throw new BadRequestException('Job is already published or completed');
    }

    job.status = JobStatus.OPEN;
    return this.jobsRepository.save(job);
  }

  async cancel(id: string, userId: string): Promise<Job> {
    const job = await this.findOne(id);

    if (job.client_id !== userId) {
      throw new ForbiddenException('You can only cancel your own jobs');
    }

    if (job.status === JobStatus.DONE || job.status === JobStatus.CANCELLED) {
      throw new BadRequestException('Job cannot be cancelled');
    }

    job.status = JobStatus.CANCELLED;
    return this.jobsRepository.save(job);
  }

  async delete(id: string, userId: string): Promise<void> {
    const job = await this.findOne(id);

    if (job.client_id !== userId) {
      throw new ForbiddenException('You can only delete your own jobs');
    }

    // JobStatus does not include IN_PROGRESS; "active booking" is represented by BOOKED.
    if (job.status === JobStatus.BOOKED) {
      throw new BadRequestException('Cannot delete job with active booking');
    }

    await this.jobsRepository.remove(job);
  }
}
