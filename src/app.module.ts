import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CareproModule } from './carepro/carepro.module';
import { ClientModule } from './client/client.module';
import { JobsModule } from './jobs/jobs.module';
import { MatchingModule } from './matching/matching.module';
import { ProposalsModule } from './proposals/proposals.module';
import { BookingsModule } from './bookings/bookings.module';
import { TimesheetsModule } from './timesheets/timesheets.module';
import { PaymentsModule } from './payments/payments.module';
import { PayoutsModule } from './payouts/payouts.module';
import { ReviewsModule } from './reviews/reviews.module';
import { MessagesModule } from './messages/messages.module';
import { VerificationsModule } from './verifications/verifications.module';
import { DisputesModule } from './disputes/disputes.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { OtpModule } from './otp/otp.module';
import { FileStorageModule } from './file-storage/file-storage.module';
import { databaseConfig } from './config/database.config';
import { redisConfig } from './config/redis.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    DatabaseModule,

    // Cache (Redis) - Optional, can be disabled if Redis is not available
    ...(process.env.REDIS_HOST
      ? [CacheModule.registerAsync(redisConfig())]
      : [CacheModule.register({ ttl: 300 })]),

    // Scheduler
    ScheduleModule.forRoot(),

    // Logging
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context }) => {
              return `${timestamp} [${context}] ${level}: ${message}`;
            }),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    CareproModule,
    ClientModule,
    JobsModule,
    MatchingModule,
    ProposalsModule,
    BookingsModule,
    TimesheetsModule,
    PaymentsModule,
    PayoutsModule,
    ReviewsModule,
    MessagesModule,
    VerificationsModule,
    DisputesModule,
    NotificationsModule,
    AdminModule,
    OtpModule,
    FileStorageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

