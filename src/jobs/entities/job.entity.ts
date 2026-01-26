import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Proposal } from '../../proposals/entities/proposal.entity';
import { Booking } from '../../bookings/entities/booking.entity';

export enum JobStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  BOOKED = 'BOOKED',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

@Entity('jobs')
@Index(['client_id'])
@Index(['status'])
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  client_id: string;

  @ManyToOne(() => User, (user) => user.jobs, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Column({ type: 'varchar', length: 64 })
  service_type: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location_point: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'timestamptz', nullable: true })
  start_time: Date;

  @Column({ type: 'timestamptz', nullable: true })
  end_time: Date;

  @Column({ type: 'int', nullable: true })
  budget_min: number;

  @Column({ type: 'int', nullable: true })
  budget_max: number;

  @Column({
    type: 'varchar',
    length: 16,
    default: JobStatus.DRAFT,
  })
  status: JobStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  // Relations
  @OneToMany(() => Proposal, (proposal) => proposal.job)
  proposals: Proposal[];

  @OneToMany(() => Booking, (booking) => booking.job)
  bookings: Booking[];
}

