import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'O2O Care Platform API v1.0';
  }
}

