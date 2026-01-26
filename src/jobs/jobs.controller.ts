import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobStatus } from './entities/job.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Jobs')
@Controller('jobs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new job' })
  async create(@CurrentUser() user: User, @Body() dto: CreateJobDto) {
    return this.jobsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all jobs' })
  async findAll(
    @Query('status') status?: JobStatus,
    @Query('service_type') serviceType?: string,
    @Query('search') search?: string,
  ) {
    return this.jobsService.findAll(status, serviceType, search);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find jobs nearby' })
  async findNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius?: number,
  ) {
    return this.jobsService.findNearby(lat, lng, radius);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user jobs' })
  async getMyJobs(@CurrentUser() user: User) {
    return this.jobsService.findByClient(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID' })
  async findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update job' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateJobDto,
  ) {
    return this.jobsService.update(id, user.id, dto);
  }

  @Put(':id/publish')
  @ApiOperation({ summary: 'Publish job' })
  async publish(@Param('id') id: string, @CurrentUser() user: User) {
    return this.jobsService.publish(id, user.id);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel job' })
  async cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.jobsService.cancel(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete job' })
  async delete(@Param('id') id: string, @CurrentUser() user: User) {
    await this.jobsService.delete(id, user.id);
    return { message: 'Job deleted successfully' };
  }
}
