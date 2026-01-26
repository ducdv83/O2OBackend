import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Job } from '../../jobs/entities/job.entity';
import { User } from '../../users/entities/user.entity';

export enum ProposalStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

@Entity('proposals')
@Index(['job_id'])
@Index(['carepro_id'])
export class Proposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  job_id: string;

  @ManyToOne(() => Job, (job) => job.proposals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({ type: 'uuid' })
  carepro_id: string;

  @ManyToOne(() => User, (user) => user.proposals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carepro_id' })
  carepro: User;

  @Column({ type: 'int' })
  proposed_rate: number;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({
    type: 'varchar',
    length: 16,
    default: ProposalStatus.PENDING,
  })
  status: ProposalStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}

