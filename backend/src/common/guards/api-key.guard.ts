import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../exceptions/app.exception';

/**
 * Guard that validates Bearer token against user.apiKey field.
 * Used for public API endpoints (Enterprise plan only).
 * Sets req.apiUser with the authenticated user data.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppException.forbidden('API Key ausente. Envie o header: Authorization: Bearer <sua-api-key>');
    }

    const apiKey = authHeader.replace('Bearer ', '').trim();
    if (!apiKey || apiKey.length < 32) {
      throw AppException.forbidden('API Key inválida.');
    }

    const user = await this.prisma.user.findUnique({
      where: { apiKey },
      select: { id: true, email: true, plan: true, name: true },
    });

    if (!user) {
      throw AppException.forbidden('API Key não encontrada ou revogada.');
    }

    if (user.plan !== 'ENTERPRISE') {
      throw AppException.forbidden('API disponível apenas no plano Enterprise.');
    }

    // Attach user to request for downstream use
    request.apiUser = user;
    return true;
  }
}
