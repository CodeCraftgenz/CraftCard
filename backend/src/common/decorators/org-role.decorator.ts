import { SetMetadata } from '@nestjs/common';

export const ORG_ROLE_KEY = 'requiredOrgRole';

/**
 * Restrict endpoint to users with a minimum organization role.
 * Reads :orgId from route params.
 * Usage: @RequiresOrgRole('ADMIN') — requires ADMIN or OWNER
 */
export const RequiresOrgRole = (minRole: 'MEMBER' | 'ADMIN' | 'OWNER') =>
  SetMetadata(ORG_ROLE_KEY, minRole);
