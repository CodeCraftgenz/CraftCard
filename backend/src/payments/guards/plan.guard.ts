import { Injectable, CanActivate, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException } from '../../common/exceptions/app.exception';
import { hasFeature, type PlanLimits } from '../plan-limits';

export const REQUIRED_FEATURE_KEY = 'requiredFeature';

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
    private readonly prisma: PrismaService,
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

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user) {
      throw AppException.unauthorized();
    }

    if (!hasFeature(user.plan, feature)) {
      throw AppException.forbidden(
        `Recurso disponivel a partir do plano Pro. Faca upgrade para acessar.`,
      );
    }

    return true;
  }
}
