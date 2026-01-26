import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessagesGateway } from '../messages/messages.gateway';

export interface NotificationPayload {
  type: string;
  title: string;
  body: string;
  data?: any;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private configService: ConfigService,
    private messagesGateway: MessagesGateway,
  ) {}

  /**
   * Send push notification via FCM
   */
  async sendPushNotification(
    userId: string,
    fcmToken: string,
    payload: NotificationPayload,
  ): Promise<void> {
    // TODO: Integrate with Firebase Cloud Messaging
    this.logger.log(
      `Sending push notification to user ${userId}: ${payload.title}`,
    );
    // For now, just log
  }

  /**
   * Send in-app notification via WebSocket
   */
  async sendInAppNotification(
    userId: string,
    payload: NotificationPayload,
  ): Promise<void> {
    this.messagesGateway.sendNotification(userId, payload);
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(
    email: string,
    subject: string,
    body: string,
  ): Promise<void> {
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    this.logger.log(`Sending email to ${email}: ${subject}`);
  }

  /**
   * Notify booking status change
   */
  async notifyBookingStatusChange(
    bookingId: string,
    userId: string,
    status: string,
  ): Promise<void> {
    const payload: NotificationPayload = {
      type: 'booking_status',
      title: 'Booking Status Updated',
      body: `Your booking status has been updated to ${status}`,
      data: { bookingId, status },
    };

    await this.sendInAppNotification(userId, payload);
  }

  /**
   * Notify new message
   */
  async notifyNewMessage(
    bookingId: string,
    userId: string,
    senderName: string,
  ): Promise<void> {
    const payload: NotificationPayload = {
      type: 'new_message',
      title: 'New Message',
      body: `You have a new message from ${senderName}`,
      data: { bookingId },
    };

    await this.sendInAppNotification(userId, payload);
  }

  /**
   * Notify payment status
   */
  async notifyPaymentStatus(
    paymentId: string,
    userId: string,
    status: string,
  ): Promise<void> {
    const payload: NotificationPayload = {
      type: 'payment_status',
      title: 'Payment Status Updated',
      body: `Your payment status has been updated to ${status}`,
      data: { paymentId, status },
    };

    await this.sendInAppNotification(userId, payload);
  }
}
