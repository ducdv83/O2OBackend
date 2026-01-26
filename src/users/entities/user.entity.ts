import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CareproProfile } from '../../carepro/entities/carepro-profile.entity';
import { ClientProfile } from '../../client/entities/client-profile.entity';
import { Job } from '../../jobs/entities/job.entity';
import { Proposal } from '../../proposals/entities/proposal.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Message } from '../../messages/entities/message.entity';
import { Verification } from '../../verifications/entities/verification.entity';
import { Payout } from '../../payouts/entities/payout.entity';
import { Dispute } from '../../disputes/entities/dispute.entity';

export enum UserRole {
  CLIENT = 'CLIENT',
  CAREPRO = 'CAREPRO',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 16 })
  role: UserRole;

  @Column({ type: 'varchar', length: 32, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  password_hash: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  full_name: string;

  @Column({ type: 'date', nullable: true })
  dob: Date;

  @Column({ type: 'varchar', length: 16, nullable: true })
  gender: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  // Relations
  @OneToOne(() => CareproProfile, (profile) => profile.user, { cascade: true })
  careproProfile: CareproProfile;

  @OneToOne(() => ClientProfile, (profile) => profile.user, { cascade: true })
  clientProfile: ClientProfile;

  @OneToMany(() => Job, (job) => job.client)
  jobs: Job[];

  @OneToMany(() => Proposal, (proposal) => proposal.carepro)
  proposals: Proposal[];

  @OneToMany(() => Booking, (booking) => booking.carepro)
  bookings: Booking[];

  @OneToMany(() => Review, (review) => review.rater)
  reviewsGiven: Review[];

  @OneToMany(() => Review, (review) => review.ratee)
  reviewsReceived: Review[];

  @OneToMany(() => Message, (message) => message.sender)
  messages: Message[];

  @OneToMany(() => Verification, (verification) => verification.user)
  verifications: Verification[];

  @OneToMany(() => Payout, (payout) => payout.user)
  payouts: Payout[];

  @OneToMany(() => Dispute, (dispute) => dispute.openedBy)
  disputes: Dispute[];
}

