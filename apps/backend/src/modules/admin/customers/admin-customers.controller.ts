import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '@/common/decorators/roles.decorator';
import { Audit } from '@/common/decorators/audit.decorator';
import { AuditInterceptor } from '@/common/interceptors/audit.interceptor';
import { AdminCustomersService } from './admin-customers.service';

@ApiTags('admin-customers')
@ApiBearerAuth()
@Roles('STAFF', 'BRANCH_MANAGER', 'SUPER_ADMIN')
@UseInterceptors(AuditInterceptor)
@Controller({ path: 'admin/customers', version: '1' })
export class AdminCustomersController {
  constructor(private readonly customers: AdminCustomersService) {}

  @Get()
  list(@Query('q') q?: string) {
    return this.customers.list(q);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.customers.findById(id);
  }

  @Post(':id/suspend')
  @HttpCode(204)
  @Audit({ action: 'customer.suspend', entityType: 'User' })
  async suspend(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<void> {
    await this.customers.suspend(id);
  }

  @Post(':id/reactivate')
  @HttpCode(204)
  @Audit({ action: 'customer.reactivate', entityType: 'User' })
  async reactivate(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<void> {
    await this.customers.reactivate(id);
  }
}
