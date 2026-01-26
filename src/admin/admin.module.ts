import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Booking } from '../bookings/entities/booking.entity';
import { Job } from '../jobs/entities/job.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Dispute } from '../disputes/entities/dispute.entity';
import { User } from '../users/entities/user.entity';
import { CareproProfile } from '../carepro/entities/carepro-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      Job,
      Payment,
      Dispute,
      User,
      CareproProfile,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

