import { Controller, Post, Get, Body, Headers, Query, Logger } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  async createCheckout(@CurrentUser() user: JwtPayload) {
    return this.paymentsService.createCheckoutPreference(user.sub, user.email);
  }

  /** Admin: activate a plan for any user by email */
  @Post('admin/activate-plan')
  async adminActivatePlan(
    @CurrentUser() user: JwtPayload,
    @Body() body: { email: string; plan: string; days?: number },
  ) {
    return this.paymentsService.adminActivatePlan(user.sub, body.email, body.plan, body.days);
  }

  /** Admin: list all users with their plans */
  @Get('admin/users')
  async adminListUsers(@CurrentUser() user: JwtPayload) {
    return this.paymentsService.adminListUsers(user.sub);
  }

  /**
   * Verify and sync payment status for the current user.
   * Called by frontend after redirect from Mercado Pago as a fallback
   * in case the webhook hasn't arrived yet.
   */
  @Post('verify')
  async verifyPayment(@CurrentUser() user: JwtPayload) {
    return this.paymentsService.verifyPendingPayments(user.sub);
  }

  @Public()
  @SkipThrottle()
  @Post('webhook')
  async handleWebhook(
    @Body() body: { type?: string; action?: string; data?: { id?: string } },
    @Headers('x-signature') xSignature: string,
    @Headers('x-request-id') xRequestId: string,
    @Query('id') queryId: string,
    @Query('topic') queryTopic: string,
  ) {
    this.logger.log(
      `Webhook received - body.type: ${body?.type}, action: ${body?.action}, data.id: ${body?.data?.id}, query.topic: ${queryTopic}, query.id: ${queryId}`,
    );

    // Handle both IPN (query params) and Webhook (JSON body) formats
    if (queryTopic === 'payment' && queryId) {
      // IPN format: ?topic=payment&id=12345
      this.logger.log(`Processing IPN notification: payment ${queryId}`);
      await this.paymentsService.processPaymentNotificationById(queryId);
      return { received: true };
    }

    // Webhook format: JSON body
    await this.paymentsService.handleWebhook(body, { xSignature, xRequestId });
    return { received: true };
  }
}
