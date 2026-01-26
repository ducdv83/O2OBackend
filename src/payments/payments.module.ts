import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { EscrowService } from './escrow.service';
import { Payment } from './entities/payment.entity';
import { Booking } from '../bookings/entities/booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Booking])],
  controllers: [PaymentsController],
  providers: [PaymentsService, EscrowService],
  exports: [PaymentsService, EscrowService],
})
export class PaymentsModule {}

