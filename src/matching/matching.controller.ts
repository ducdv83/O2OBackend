import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MatchingService } from './matching.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Matching')
@Controller('matching')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('jobs/:jobId/carepros')
  @ApiOperation({ summary: 'Get matched CarePros for a job' })
  async getMatchedCarePros(
    @Param('jobId') jobId: string,
    @Query('limit') limit?: number,
  ) {
    return this.matchingService.getMatchedCarePros(jobId, limit || 20);
  }

  @Get('carepros/me/jobs')
  @ApiOperation({ summary: 'Get matched jobs for current CarePro' })
  async getMatchedJobs(
    @CurrentUser() user: User,
    @Query('limit') limit?: number,
  ) {
    return this.matchingService.getMatchedJobs(user.id, limit || 20);
  }
}

