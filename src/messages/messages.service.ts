import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { Booking } from '../bookings/entities/booking.entity';
import { MessagesGateway } from './messages.gateway';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    private messagesGateway: MessagesGateway,
  ) {}

  async create(senderId: string, dto: CreateMessageDto): Promise<Message> {
    const booking = await this.bookingsRepository.findOne({
      where: { id: dto.booking_id },
      relations: ['carepro', 'job'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify sender is part of this booking
    const isClient = booking.job.client_id === senderId;
    const isCarepro = booking.carepro_id === senderId;

    if (!isClient && !isCarepro) {
      throw new ForbiddenException('You are not part of this booking');
    }

    const message = this.messagesRepository.create({
      booking_id: dto.booking_id,
      sender_id: senderId,
      body: dto.body,
    });

    const savedMessage = await this.messagesRepository.save(message);

    // Emit message via WebSocket
    this.messagesGateway.sendMessage(dto.booking_id, savedMessage);

    return savedMessage;
  }

  async findByBooking(bookingId: string, userId: string): Promise<Message[]> {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId },
      relations: ['carepro', 'job'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify user is part of this booking
    const isClient = booking.job.client_id === userId;
    const isCarepro = booking.carepro_id === userId;

    if (!isClient && !isCarepro) {
      throw new ForbiddenException('You are not part of this booking');
    }

    return this.messagesRepository.find({
      where: { booking_id: bookingId },
      relations: ['sender'],
      order: { sent_at: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Message> {
    const message = await this.messagesRepository.findOne({
      where: { id },
      relations: ['sender', 'booking'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }
}
