import { Controller, Post, Body, Headers } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  async createCheckout(@CurrentUser() user: JwtPayload) {
    return this.paymentsService.createCheckoutPreference(user.sub, user.email);
  }

  @Public()
  @Post('webhook')
  async handleWebhook(
    @Body() body: { type?: string; data?: { id?: string } },
    @Headers('x-signature') xSignature: string,
    @Headers('x-request-id') xRequestId: string,
  ) {
    await this.paymentsService.handleWebhook(body, { xSignature, xRequestId });
    return { received: true };
  }
}
