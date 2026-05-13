import { SetMetadata } from '@nestjs/common';
import type { AuthUser } from './current-user.decorator';

export const ROLES_KEY = 'roles';

export const Roles = (
  ...roles: Array<AuthUser['role']>
): MethodDecorator & ClassDecorator => SetMetadata(ROLES_KEY, roles);
