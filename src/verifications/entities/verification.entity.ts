import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum VerificationType {
  ID = 'ID',
  CERT = 'CERT',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('verifications')
export class Verification {
  @PrimaryColumn({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, (user) => user.verifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @PrimaryColumn({ type: 'varchar', length: 8 })
  type: VerificationType;

  @Column({
    type: 'varchar',
    length: 16,
    default: VerificationStatus.PENDING,
  })
  status: VerificationStatus;

  @Column({ type: 'text', nullable: true })
  file_url: string;

  @Column({ type: 'timestamptz', nullable: true })
  verified_at: Date;
}

