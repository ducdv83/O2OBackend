import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { CareproService } from '../carepro/carepro.service';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    private careproService: CareproService,
  ) {}

  async create(raterId: string, dto: CreateReviewDto): Promise<Review> {
    const booking = await this.bookingsRepository.findOne({
      where: { id: dto.booking_id },
      relations: ['carepro', 'job'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Can only review completed bookings');
    }

    // Determine ratee (the other party)
    const isClient = booking.job.client_id === raterId;
    const isCarepro = booking.carepro_id === raterId;

    if (!isClient && !isCarepro) {
      throw new ForbiddenException('You are not part of this booking');
    }

    const rateeId = isClient ? booking.carepro_id : booking.job.client_id;

    // Check if review already exists
    const existing = await this.reviewsRepository.findOne({
      where: {
        booking_id: dto.booking_id,
        rater_id: raterId,
      },
    });

    if (existing) {
      throw new BadRequestException('Review already exists for this booking');
    }

    const review = this.reviewsRepository.create({
      booking_id: dto.booking_id,
      rater_id: raterId,
      ratee_id: rateeId,
      rating: dto.rating,
      comment: dto.comment,
    });

    const savedReview = await this.reviewsRepository.save(review);

    // Update CarePro rating if ratee is CarePro
    if (isClient) {
      await this.careproService.updateRating(rateeId, dto.rating);
    }

    return savedReview;
  }

  async findAll(rateeId?: string, role?: 'carepro' | 'client'): Promise<Review[]> {
    const where: any = {};
    if (rateeId) where.ratee_id = rateeId;

    const query = this.reviewsRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.rater', 'rater')
      .leftJoinAndSelect('review.ratee', 'ratee')
      .leftJoinAndSelect('review.booking', 'booking')
      .where(where);

    if (role === 'carepro') {
      query.andWhere('ratee.role = :role', { role: 'CAREPRO' });
    } else if (role === 'client') {
      query.andWhere('ratee.role = :role', { role: 'CLIENT' });
    }

    return query.orderBy('review.created_at', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewsRepository.findOne({
      where: { id },
      relations: ['rater', 'ratee', 'booking'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }
}
