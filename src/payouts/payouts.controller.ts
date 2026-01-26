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
import { PayoutsService } from './payouts.service';
import { CreatePayoutDto } from './dto/create-payout.dto';
import { PayoutStatus } from './entities/payout.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('Payouts')
@Controller('payouts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Post()
  @ApiOperation({ summary: 'Request payout' })
  async create(@CurrentUser() user: User, @Body() dto: CreatePayoutDto) {
    return this.payoutsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payouts' })
  async findAll(
    @Query('status') status?: PayoutStatus,
    @CurrentUser() user?: User,
  ) {
    return this.payoutsService.findAll(user?.id, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payout by ID' })
  async findOne(@Param('id') id: string) {
    return this.payoutsService.findOne(id);
  }

  @Put(':id/process')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Process payout (Admin only)' })
  async process(@Param('id') id: string, @CurrentUser() user: User) {
    return this.payoutsService.process(id, user.id);
  }

  @Put(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve payout (Admin only)' })
  async approve(@Param('id') id: string, @CurrentUser() user: User) {
    return this.payoutsService.approve(id, user.id);
  }

  @Put(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject payout (Admin only)' })
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body('reason') reason?: string,
  ) {
    return this.payoutsService.reject(id, user.id, reason);
  }
}
