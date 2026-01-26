import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { ClientProfile } from './entities/client-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClientProfile])],
  controllers: [ClientController],
  providers: [ClientService],
  exports: [ClientService],
})
export class ClientModule {}

