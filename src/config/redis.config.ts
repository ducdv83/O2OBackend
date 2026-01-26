import { ConfigService } from '@nestjs/config';
import { CacheModuleOptions } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

export const redisConfig = () => ({
  inject: [ConfigService],
  useFactory: async (configService: ConfigService): Promise<CacheModuleOptions> => {
    return {
      store: redisStore,
      host: configService.get<string>('REDIS_HOST', 'localhost'),
      port: configService.get<number>('REDIS_PORT', 6379),
      password: configService.get<string>('REDIS_PASSWORD'),
      ttl: 300, // 5 minutes default
    };
  },
});

