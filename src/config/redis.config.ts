import { ConfigService } from '@nestjs/config';
import { CacheModuleOptions } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

export const redisConfig = () => ({
  inject: [ConfigService],
  useFactory: async (configService: ConfigService): Promise<CacheModuleOptions> => {
    return {
      // cache-manager-redis-store typing is not fully compatible with CacheModuleOptions["store"]
      // so we cast it to keep TS compile happy (even when Redis is disabled).
      store: redisStore as unknown as CacheModuleOptions['store'],
      host: configService.get<string>('REDIS_HOST', 'localhost'),
      port: configService.get<number>('REDIS_PORT', 6379),
      password: configService.get<string>('REDIS_PASSWORD'),
      ttl: 300, // 5 minutes default
    };
  },
});

