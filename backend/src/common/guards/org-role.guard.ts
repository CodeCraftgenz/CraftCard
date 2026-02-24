import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { ORG_ROLE_KEY } from '../decorators/org-role.decorator';
import { AppException } from '../exceptions/app.exception';

const ROLE_HIERARCHY: Record<string, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
};

@Injectable()
export class OrgRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const minRole = this.reflector.getAllAndOverride<string | undefined>(ORG_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!minRole) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;

    if (!userId) {
      throw AppException.unauthorized();
    }

    const orgId = request.params?.orgId;
    if (!orgId) {
      throw AppException.badRequest('orgId is required');
    }

    // SUPER_ADMIN bypass: platform admins can access any org
    if (request.user?.role === 'SUPER_ADMIN') return true;

    const member = await this.prisma.organizationMember.findUnique({
      where: { orgId_userId: { orgId, userId } },
    });

    if (!member) {
      throw AppException.forbidden('Voce nao e membro desta organizacao');
    }

    if ((ROLE_HIERARCHY[member.role] || 0) < (ROLE_HIERARCHY[minRole] || 0)) {
      throw AppException.forbidden('Permissao insuficiente');
    }

    // Attach member info for use in controller/service
    request.orgMember = member;

    return true;
  }
}
