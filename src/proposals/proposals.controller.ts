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
import { ProposalsService } from './proposals.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Proposals')
@Controller('proposals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a proposal' })
  async create(@CurrentUser() user: User, @Body() dto: CreateProposalDto) {
    return this.proposalsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all proposals' })
  async findAll(
    @Query('job_id') jobId?: string,
    @Query('carepro_id') careproId?: string,
  ) {
    return this.proposalsService.findAll(jobId, careproId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get proposal by ID' })
  async findOne(@Param('id') id: string) {
    return this.proposalsService.findOne(id);
  }

  @Put(':id/accept')
  @ApiOperation({ summary: 'Accept a proposal' })
  async accept(@Param('id') id: string, @CurrentUser() user: User) {
    return this.proposalsService.accept(id, user.id);
  }

  @Put(':id/reject')
  @ApiOperation({ summary: 'Reject a proposal' })
  async reject(@Param('id') id: string, @CurrentUser() user: User) {
    return this.proposalsService.reject(id, user.id);
  }
}
