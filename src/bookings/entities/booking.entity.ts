import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Job } from '../../jobs/entities/job.entity';
import { User } from '../../users/entities/user.entity';
import { Timesheet } from '../../timesheets/entities/timesheet.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Message } from '../../messages/entities/message.entity';
import { Dispute } from '../../disputes/entities/dispute.entity';

export enum BookingStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED',
}

@Entity('bookings')
@Index(['status'])
@Index(['carepro_id'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  job_id: string;

  @ManyToOne(() => Job, (job) => job.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({ type: 'uuid' })
  carepro_id: string;

  @ManyToOne(() => User, (user) => user.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carepro_id' })
  carepro: User;

  @Column({ type: 'int' })
  agreed_rate: number;

  @Column({ type: 'timestamptz' })
  start_time: Date;

  @Column({ type: 'timestamptz' })
  end_time: Date;

  @Column({
    type: 'varchar',
    length: 16,
    default: BookingStatus.SCHEDULED,
  })
  status: BookingStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  // Relations
  @OneToOne(() => Timesheet, (timesheet) => timesheet.booking)
  timesheet: Timesheet;

  @OneToMany(() => Payment, (payment) => payment.booking)
  payments: Payment[];

  @OneToMany(() => Review, (review) => review.booking)
  reviews: Review[];

  @OneToMany(() => Message, (message) => message.booking)
  messages: Message[];

  @OneToMany(() => Dispute, (dispute) => dispute.booking)
  disputes: Dispute[];
}

