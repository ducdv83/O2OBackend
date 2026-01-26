import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import { User } from '../../users/entities/user.entity';

@Entity('reviews')
@Index(['ratee_id'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  booking_id: string;

  @ManyToOne(() => Booking, (booking) => booking.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ type: 'uuid' })
  rater_id: string;

  @ManyToOne(() => User, (user) => user.reviewsGiven, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rater_id' })
  rater: User;

  @Column({ type: 'uuid' })
  ratee_id: string;

  @ManyToOne(() => User, (user) => user.reviewsReceived, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ratee_id' })
  ratee: User;

  @Column({ type: 'int', nullable: true })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}

