import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { AdminNotificationsService } from './admin-notifications.service';

@ApiTags('admin-notifications')
@ApiBearerAuth()
@Roles('STAFF', 'BRANCH_MANAGER', 'SUPER_ADMIN')
@Controller({ path: 'admin/notifications', version: '1' })
export class AdminNotificationsController {
  constructor(private readonly notifications: AdminNotificationsService) {}

  /**
   * Real-time activity feed for the dashboard notification bell. Derived from
   * live data (leads, orders, customers, verifications). Read/unread state is
   * tracked client-side against the stable item ids.
   */
  @Get()
  list(@CurrentUser() actor: AuthUser) {
    return this.notifications.listForAdmin(actor);
  }
}
