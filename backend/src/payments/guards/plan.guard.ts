import { Injectable, CanActivate, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PaymentsService } from '../payments.service';
import { AppException } from '../../common/exceptions/app.exception';
import { hasFeature, type PlanLimits } from '../plan-limits';

export const REQUIRED_FEATURE_KEY = 'requiredFeature';

/** Maps features to the minimum plan that unlocks them */
const FEATURE_MIN_PLAN: Partial<Record<keyof PlanLimits, string>> = {
  analytics: 'Pro',
  gallery: 'Pro',
  bookings: 'Pro',
  testimonials: 'Pro',
  contacts: 'Pro',
  services: 'Pro',
  faq: 'Pro',
  resume: 'Pro',
  video: 'Pro',
  customFonts: 'Pro',
  customBg: 'Pro',
  leadsExport: 'Pro',
  orgDashboard: 'Business',
  branding: 'Business',
  webhooks: 'Business',
  customDomain: 'Enterprise',
};

/**
 * Decorator: require a specific plan feature to access this endpoint.
 * Usage: @RequiresFeature('analytics')
 */
export const RequiresFeature = (feature: keyof PlanLimits) =>
  SetMetadata(REQUIRED_FEATURE_KEY, feature);

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly paymentsService: PaymentsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<keyof PlanLimits | undefined>(
      REQUIRED_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No feature requirement → allow
    if (!feature) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;

    if (!userId) {
      throw AppException.unauthorized();
    }

    const planInfo = await this.paymentsService.getUserPlanInfo(userId);

    if (!hasFeature(planInfo.plan, feature)) {
      const minPlan = FEATURE_MIN_PLAN[feature] || 'Pro';
      throw AppException.forbidden(
        `Recurso disponivel a partir do plano ${minPlan}. Faca upgrade para acessar.`,
      );
    }

    return true;
  }
}
