import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '@/common/decorators/roles.decorator';
import { Audit } from '@/common/decorators/audit.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { AuditInterceptor } from '@/common/interceptors/audit.interceptor';
import { AdminStaffService } from './admin-staff.service';
import {
  CreateStaffDto,
  CreateStaffSchema,
  UpdateStaffDto,
  UpdateStaffSchema,
} from './dto/staff.dto';

@ApiTags('admin-staff')
@ApiBearerAuth()
@Roles('SUPER_ADMIN')
@UseInterceptors(AuditInterceptor)
@Controller({ path: 'admin/staff', version: '1' })
export class AdminStaffController {
  constructor(private readonly staff: AdminStaffService) {}

  @Get()
  list() { return this.staff.list(); }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.staff.findById(id);
  }

  @Post()
  @Audit({ action: 'staff.create', entityType: 'User', entityIdFrom: 'body', entityIdKey: 'email' })
  create(@Body(new ZodValidationPipe(CreateStaffSchema)) body: CreateStaffDto) {
    return this.staff.create(body);
  }

  @Patch(':id')
  @Audit({ action: 'staff.update', entityType: 'User' })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(UpdateStaffSchema)) body: UpdateStaffDto,
  ) {
    return this.staff.update(id, body);
  }

  @Post(':id/deactivate')
  @HttpCode(204)
  @Audit({ action: 'staff.deactivate', entityType: 'User' })
  async deactivate(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<void> {
    await this.staff.deactivate(id);
  }
}
