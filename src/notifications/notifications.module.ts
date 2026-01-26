import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [MessagesModule],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

