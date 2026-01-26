import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('carepro_profiles')
export class CareproProfile {
  @PrimaryColumn({ type: 'uuid' })
  user_id: string;

  @OneToOne(() => User, (user) => user.careproProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'int', default: 0 })
  years_exp: number;

  @Column({ type: 'text', array: true, default: [] })
  skills: string[];

  @Column({ type: 'text', array: true, default: [] })
  certificates: string[];

  @Column({ type: 'int', default: 0 })
  verified_level: number;

  @Column({ type: 'numeric', precision: 3, scale: 2, default: 0 })
  rating_avg: number;

  @Column({ type: 'int', default: 0 })
  rating_count: number;

  @Column({ type: 'int', nullable: true })
  hourly_rate_hint: number;

  @Column({ type: 'text', array: true, default: [] })
  service_types: string[];
}

