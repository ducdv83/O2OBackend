import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Hold payment in escrow
   */
  async holdPayment(paymentId: string, amount: number): Promise<void> {
    this.logger.log(`Holding payment ${paymentId} for amount ${amount}`);
    // TODO: Integrate with payment gateway to actually hold the money
    // For now, just log
  }

  /**
   * Release payment from escrow (to CarePro)
   */
  async releasePayment(paymentId: string, amount: number): Promise<void> {
    const platformFeePercent = this.configService.get<number>(
      'PLATFORM_FEE_PERCENT',
      10,
    );
    const platformFee = Math.round((amount * platformFeePercent) / 100);
    const careproAmount = amount - platformFee;

    this.logger.log(
      `Releasing payment ${paymentId}: ${careproAmount} to CarePro, ${platformFee} platform fee`,
    );
    // TODO: Integrate with payment gateway to release money
  }

  /**
   * Refund payment from escrow (to Client)
   */
  async refundPayment(paymentId: string, amount: number): Promise<void> {
    this.logger.log(`Refunding payment ${paymentId} for amount ${amount}`);
    // TODO: Integrate with payment gateway to refund money
  }

  /**
   * Auto-release payments after completion (cron job)
   * Runs daily to check for completed bookings and auto-release payments
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async autoReleasePayments(): Promise<void> {
    const autoReleaseHours = this.configService.get<number>(
      'ESCROW_AUTO_RELEASE_HOURS',
      24,
    );

    this.logger.log(
      `Auto-releasing payments completed more than ${autoReleaseHours} hours ago`,
    );
    // TODO: Query database for completed bookings with held payments
    // and release them if no disputes
  }
}
