import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { Audit } from '@/common/decorators/audit.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { AuditInterceptor } from '@/common/interceptors/audit.interceptor';
import { AdminWorkersService } from './admin-workers.service';
import {
  CreateWorkerDto,
  CreateWorkerSchema,
  UpdateWorkerDto,
  UpdateWorkerSchema,
} from './dto/worker.dto';

@ApiTags('admin-workers')
@ApiBearerAuth()
@Roles('STAFF', 'BRANCH_MANAGER', 'SUPER_ADMIN')
@UseInterceptors(AuditInterceptor)
@Controller({ path: 'admin/workers', version: '1' })
export class AdminWorkersController {
  constructor(private readonly workers: AdminWorkersService) {}

  @Get()
  list(@CurrentUser() actor: AuthUser) {
    return this.workers.list(actor);
  }

  @Get(':id')
  findOne(
    @CurrentUser() actor: AuthUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.workers.findById(id, actor);
  }

  @Post()
  @Audit({ action: 'worker.create', entityType: 'Worker', entityIdFrom: 'body', entityIdKey: 'branchId' })
  create(
    @CurrentUser() actor: AuthUser,
    @Body(new ZodValidationPipe(CreateWorkerSchema)) body: CreateWorkerDto,
  ) {
    return this.workers.create(body, actor);
  }

  @Patch(':id')
  @Audit({ action: 'worker.update', entityType: 'Worker' })
  update(
    @CurrentUser() actor: AuthUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(UpdateWorkerSchema)) body: UpdateWorkerDto,
  ) {
    return this.workers.update(id, body, actor);
  }

  @Delete(':id')
  @HttpCode(204)
  @Audit({ action: 'worker.delete', entityType: 'Worker' })
  async remove(
    @CurrentUser() actor: AuthUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    await this.workers.remove(id, actor);
  }
}
