import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';

export enum PaymentMethod {
  MOMO = 'momo',
  ZALOPAY = 'zalopay',
  CARD = 'card',
  WALLET = 'wallet',
}

export enum EscrowStatus {
  HELD = 'HELD',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  booking_id: string;

  @ManyToOne(() => Booking, (booking) => booking.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'varchar', length: 16 })
  method: PaymentMethod;

  @Column({
    type: 'varchar',
    length: 16,
    default: EscrowStatus.HELD,
  })
  escrow_status: EscrowStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}

