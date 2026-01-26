import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proposal, ProposalStatus } from './entities/proposal.entity';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { Job, JobStatus } from '../jobs/entities/job.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ProposalsService {
  constructor(
    @InjectRepository(Proposal)
    private proposalsRepository: Repository<Proposal>,
    @InjectRepository(Job)
    private jobsRepository: Repository<Job>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(careproId: string, dto: CreateProposalDto): Promise<Proposal> {
    const job = await this.jobsRepository.findOne({
      where: { id: dto.job_id },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status !== JobStatus.OPEN) {
      throw new BadRequestException('Job is not open for proposals');
    }

    const carepro = await this.usersRepository.findOne({
      where: { id: careproId },
    });

    if (!carepro || carepro.role !== 'CAREPRO') {
      throw new ForbiddenException('Only CarePro users can create proposals');
    }

    // Check if proposal already exists
    const existing = await this.proposalsRepository.findOne({
      where: {
        job_id: dto.job_id,
        carepro_id: careproId,
        status: ProposalStatus.PENDING,
      },
    });

    if (existing) {
      throw new BadRequestException('Proposal already exists for this job');
    }

    const proposal = this.proposalsRepository.create({
      job_id: dto.job_id,
      carepro_id: careproId,
      proposed_rate: dto.proposed_rate,
      message: dto.message,
      status: ProposalStatus.PENDING,
    });

    return this.proposalsRepository.save(proposal);
  }

  async findAll(jobId?: string, careproId?: string): Promise<Proposal[]> {
    const where: any = {};
    if (jobId) where.job_id = jobId;
    if (careproId) where.carepro_id = careproId;

    return this.proposalsRepository.find({
      where,
      relations: ['job', 'carepro'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Proposal> {
    const proposal = await this.proposalsRepository.findOne({
      where: { id },
      relations: ['job', 'carepro'],
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    return proposal;
  }

  async accept(proposalId: string, clientId: string): Promise<Proposal> {
    const proposal = await this.findOne(proposalId);

    if (proposal.job.client_id !== clientId) {
      throw new ForbiddenException('Only job owner can accept proposals');
    }

    if (proposal.status !== ProposalStatus.PENDING) {
      throw new BadRequestException('Proposal is not pending');
    }

    proposal.status = ProposalStatus.ACCEPTED;

    // Reject all other proposals for this job
    await this.proposalsRepository
      .createQueryBuilder()
      .update(Proposal)
      .set({ status: ProposalStatus.REJECTED })
      .where('job_id = :jobId', { jobId: proposal.job_id })
      .andWhere('id != :proposalId', { proposalId })
      .andWhere('status = :status', { status: ProposalStatus.PENDING })
      .execute();

    // Update job status
    proposal.job.status = JobStatus.BOOKED;
    await this.jobsRepository.save(proposal.job);

    return this.proposalsRepository.save(proposal);
  }

  async reject(proposalId: string, clientId: string): Promise<Proposal> {
    const proposal = await this.findOne(proposalId);

    if (proposal.job.client_id !== clientId) {
      throw new ForbiddenException('Only job owner can reject proposals');
    }

    if (proposal.status !== ProposalStatus.PENDING) {
      throw new BadRequestException('Proposal is not pending');
    }

    proposal.status = ProposalStatus.REJECTED;
    return this.proposalsRepository.save(proposal);
  }
}
