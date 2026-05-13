import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface AuthUser {
  id: string;
  role: 'CUSTOMER' | 'STAFF' | 'BRANCH_MANAGER' | 'SUPER_ADMIN';
  branchId?: string;
  audience: 'mawared-customer' | 'mawared-admin';
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    return req.user;
  },
);
