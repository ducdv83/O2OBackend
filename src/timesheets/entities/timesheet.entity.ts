import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('timesheets')
export class Timesheet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  booking_id: string;

  @OneToOne(() => Booking, (booking) => booking.timesheet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ type: 'timestamptz', nullable: true })
  checkin_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  checkout_at: Date;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  hours: number;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  gps_checkin: string;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  gps_checkout: string;

  @Column({ type: 'boolean', default: false })
  client_confirmed: boolean;
}

