import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { Review } from './entities/review.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { CareproModule } from '../carepro/carepro.module';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Booking]), CareproModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}

