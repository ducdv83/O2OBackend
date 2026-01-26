import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProfile } from './entities/client-profile.entity';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(ClientProfile)
    private clientRepository: Repository<ClientProfile>,
  ) {}
}

