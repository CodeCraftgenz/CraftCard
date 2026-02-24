import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Restrict endpoint to users with specific roles.
 * Usage: @Roles('SUPER_ADMIN') or @Roles('ADMIN', 'SUPER_ADMIN')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
