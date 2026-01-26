import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('client_profiles')
export class ClientProfile {
  @PrimaryColumn({ type: 'uuid' })
  user_id: string;

  @OneToOne(() => User, (user) => user.clientProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text', nullable: true })
  default_address: string;

  @Column({ type: 'text', nullable: true })
  emergency_contact: string;
}

