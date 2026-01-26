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
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { DisputeStatus } from './entities/dispute.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('Disputes')
@Controller('disputes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a dispute' })
  async create(@CurrentUser() user: User, @Body() dto: CreateDisputeDto) {
    return this.disputesService.create(user.id, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all disputes (Admin only)' })
  async findAll(@Query('status') status?: DisputeStatus) {
    return this.disputesService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dispute by ID' })
  async findOne(@Param('id') id: string) {
    return this.disputesService.findOne(id);
  }

  @Put(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Resolve dispute (Admin only)' })
  async resolve(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.disputesService.resolve(id, user.id, dto);
  }

  @Put(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject dispute (Admin only)' })
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body('reason') reason?: string,
  ) {
    return this.disputesService.reject(id, user.id, reason);
  }
}
