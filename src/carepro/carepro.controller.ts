import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CareproService } from './carepro.service';
import { CreateCareproDto } from './dto/create-carepro.dto';
import { UpdateCareproDto } from './dto/update-carepro.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('CarePro')
@Controller('carepros')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CareproController {
  constructor(private readonly careproService: CareproService) {}

  @Post()
  @ApiOperation({ summary: 'Create CarePro profile' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateCareproDto,
  ) {
    return this.careproService.create(user.id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current CarePro profile' })
  async getMe(@CurrentUser() user: User) {
    return this.careproService.findOne(user.id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current CarePro profile' })
  async updateMe(
    @CurrentUser() user: User,
    @Body() dto: UpdateCareproDto,
  ) {
    return this.careproService.update(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all CarePro profiles' })
  async findAll() {
    return this.careproService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get CarePro profile by user ID' })
  async findOne(@Param('id') id: string) {
    return this.careproService.findOne(id);
  }
}
