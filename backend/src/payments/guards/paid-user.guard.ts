import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PaymentsService } from '../payments.service';
import { AppException } from '../../common/exceptions/app.exception';

@Injectable()
export class PaidUserGuard implements CanActivate {
  constructor(private readonly paymentsService: PaymentsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;

    if (!userId) {
      throw AppException.unauthorized();
    }

    const subscription = await this.paymentsService.getActiveSubscription(userId);
    if (!subscription.active) {
      throw AppException.forbidden('Pagamento necessario para acessar este recurso');
    }

    return true;
  }
}
