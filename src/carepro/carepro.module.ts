import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CareproController } from './carepro.controller';
import { CareproService } from './carepro.service';
import { CareproProfile } from './entities/carepro-profile.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CareproProfile, User])],
  controllers: [CareproController],
  providers: [CareproService],
  exports: [CareproService],
})
export class CareproModule {}

