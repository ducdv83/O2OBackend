import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message' })
  async create(@CurrentUser() user: User, @Body() dto: CreateMessageDto) {
    return this.messagesService.create(user.id, dto);
  }

  @Get('bookings/:bookingId')
  @ApiOperation({ summary: 'Get messages for a booking' })
  async findByBooking(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: User,
  ) {
    return this.messagesService.findByBooking(bookingId, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get message by ID' })
  async findOne(@Param('id') id: string) {
    return this.messagesService.findOne(id);
  }
}
