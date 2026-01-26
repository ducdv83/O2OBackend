import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Verification, VerificationType, VerificationStatus } from './entities/verification.entity';
import { UploadVerificationDto } from './dto/upload-verification.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class VerificationsService {
  constructor(
    @InjectRepository(Verification)
    private verificationsRepository: Repository<Verification>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async upload(userId: string, dto: UploadVerificationDto): Promise<Verification> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'CAREPRO') {
      throw new BadRequestException('Only CarePro users can upload verifications');
    }

    let verification = await this.verificationsRepository.findOne({
      where: { user_id: userId, type: dto.type },
    });

    if (verification) {
      verification.file_url = dto.file_url;
      verification.status = VerificationStatus.PENDING;
      verification.verified_at = null;
    } else {
      verification = this.verificationsRepository.create({
        user_id: userId,
        type: dto.type,
        file_url: dto.file_url,
        status: VerificationStatus.PENDING,
      });
    }

    return this.verificationsRepository.save(verification);
  }

  async findAll(status?: VerificationStatus): Promise<Verification[]> {
    const where = status ? { status } : {};
    return this.verificationsRepository.find({
      where,
      relations: ['user'],
    });
  }

  async findByUser(userId: string): Promise<Verification[]> {
    return this.verificationsRepository.find({
      where: { user_id: userId },
    });
  }

  async approve(userId: string, type: VerificationType): Promise<Verification> {
    const verification = await this.verificationsRepository.findOne({
      where: { user_id: userId, type },
    });

    if (!verification) {
      throw new NotFoundException('Verification not found');
    }

    verification.status = VerificationStatus.APPROVED;
    verification.verified_at = new Date();

    return this.verificationsRepository.save(verification);
  }

  async reject(userId: string, type: VerificationType): Promise<Verification> {
    const verification = await this.verificationsRepository.findOne({
      where: { user_id: userId, type },
    });

    if (!verification) {
      throw new NotFoundException('Verification not found');
    }

    verification.status = VerificationStatus.REJECTED;
    verification.verified_at = new Date();

    return this.verificationsRepository.save(verification);
  }
}
