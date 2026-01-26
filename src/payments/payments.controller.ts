import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('hold')
  @ApiOperation({ summary: 'Create payment and hold in escrow' })
  async create(@CurrentUser() user: User, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments' })
  async findAll(@Query('booking_id') bookingId?: string) {
    return this.paymentsService.findAll(bookingId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  async findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Put(':id/release')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Release payment from escrow (Admin only)' })
  async release(@Param('id') id: string) {
    return this.paymentsService.release(id);
  }

  @Put(':id/refund')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Refund payment (Admin only)' })
  async refund(
    @Param('id') id: string,
    @Body('amount') amount?: number,
  ) {
    return this.paymentsService.refund(id, amount);
  }
}
