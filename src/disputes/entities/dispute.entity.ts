import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import { User } from '../../users/entities/user.entity';

export enum DisputeStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

@Entity('disputes')
export class Dispute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  booking_id: string;

  @ManyToOne(() => Booking, (booking) => booking.disputes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ type: 'uuid' })
  opened_by: string;

  @ManyToOne(() => User, (user) => user.disputes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'opened_by' })
  openedBy: User;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'text', array: true, default: [] })
  evidence_urls: string[];

  @Column({
    type: 'varchar',
    length: 16,
    default: DisputeStatus.OPEN,
  })
  status: DisputeStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}

