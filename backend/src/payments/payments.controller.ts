import { Controller, Post, Req, Headers } from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('stripe')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout-session')
  async createCheckoutSession(@CurrentUser() user: JwtPayload) {
    return this.paymentsService.createCheckoutSession(user.sub, user.email);
  }

  @Public()
  @Post('webhook')
  async handleWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    await this.paymentsService.handleWebhook(rawBody, signature);
    return { received: true };
  }
}
