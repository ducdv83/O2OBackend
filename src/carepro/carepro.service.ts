import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CareproProfile } from './entities/carepro-profile.entity';
import { CreateCareproDto } from './dto/create-carepro.dto';
import { UpdateCareproDto } from './dto/update-carepro.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CareproService {
  constructor(
    @InjectRepository(CareproProfile)
    private careproRepository: Repository<CareproProfile>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(userId: string, dto: CreateCareproDto): Promise<CareproProfile> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'CAREPRO') {
      throw new ForbiddenException('User must be a CarePro to create profile');
    }

    const existingProfile = await this.careproRepository.findOne({
      where: { user_id: userId },
    });

    if (existingProfile) {
      throw new ForbiddenException('CarePro profile already exists');
    }

    const profile = this.careproRepository.create({
      user_id: userId,
      ...dto,
    });

    return this.careproRepository.save(profile);
  }

  async findOne(userId: string): Promise<CareproProfile> {
    const profile = await this.careproRepository.findOne({
      where: { user_id: userId },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException('CarePro profile not found');
    }

    return profile;
  }

  async findAll(): Promise<CareproProfile[]> {
    return this.careproRepository.find({
      relations: ['user'],
    });
  }

  async update(userId: string, dto: UpdateCareproDto): Promise<CareproProfile> {
    const profile = await this.findOne(userId);
    Object.assign(profile, dto);
    return this.careproRepository.save(profile);
  }

  async updateRating(userId: string, newRating: number): Promise<CareproProfile> {
    const profile = await this.findOne(userId);
    
    // Calculate new average rating
    const totalRating = profile.rating_avg * profile.rating_count + newRating;
    profile.rating_count += 1;
    profile.rating_avg = totalRating / profile.rating_count;

    return this.careproRepository.save(profile);
  }
}
