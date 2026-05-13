import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '@/common/decorators/roles.decorator';
import { Audit } from '@/common/decorators/audit.decorator';
import { AuditInterceptor } from '@/common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { AdminCatalogService } from './admin-catalog.service';
import {
  CreateServiceDto,
  CreateServiceSchema,
  UpdateServiceDto,
  UpdateServiceSchema,
} from './dto/service.dto';
import {
  CreatePackageDto,
  CreatePackageSchema,
  UpdatePackageDto,
  UpdatePackageSchema,
} from './dto/package.dto';

@ApiTags('admin-catalog')
@ApiBearerAuth()
@Roles('STAFF', 'SUPER_ADMIN', 'SALES')
@UseInterceptors(AuditInterceptor)
@Controller({ version: '1' })
export class AdminCatalogController {
  constructor(private readonly catalog: AdminCatalogService) {}

  // ===== Services =====

  @Get('admin/services')
  listServices() {
    return this.catalog.listServices();
  }

  @Get('admin/services/:id')
  findService(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.catalog.findServiceById(id);
  }

  @Post('admin/services')
  @Audit({ action: 'service.create', entityType: 'ServiceCategory', entityIdFrom: 'body', entityIdKey: 'slug' })
  createService(@Body(new ZodValidationPipe(CreateServiceSchema)) body: CreateServiceDto) {
    return this.catalog.createService(body);
  }

  @Patch('admin/services/:id')
  @Audit({ action: 'service.update', entityType: 'ServiceCategory' })
  updateService(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(UpdateServiceSchema)) body: UpdateServiceDto,
  ) {
    return this.catalog.updateService(id, body);
  }

  @Post('admin/services/:id/deactivate')
  @HttpCode(204)
  @Audit({ action: 'service.deactivate', entityType: 'ServiceCategory' })
  async deactivateService(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<void> {
    await this.catalog.deactivateService(id);
  }

  // ===== Packages =====

  @Get('admin/packages')
  listPackages(@Query('serviceId') serviceId?: string) {
    return this.catalog.listPackages(serviceId);
  }

  @Get('admin/packages/:id')
  findPackage(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.catalog.findPackageById(id);
  }

  @Post('admin/packages')
  @Audit({ action: 'package.create', entityType: 'ServicePackage', entityIdFrom: 'body', entityIdKey: 'serviceId' })
  createPackage(@Body(new ZodValidationPipe(CreatePackageSchema)) body: CreatePackageDto) {
    return this.catalog.createPackage(body);
  }

  @Patch('admin/packages/:id')
  @Audit({ action: 'package.update', entityType: 'ServicePackage' })
  updatePackage(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(UpdatePackageSchema)) body: UpdatePackageDto,
  ) {
    return this.catalog.updatePackage(id, body);
  }

  @Post('admin/packages/:id/deactivate')
  @HttpCode(204)
  @Audit({ action: 'package.deactivate', entityType: 'ServicePackage' })
  async deactivatePackage(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<void> {
    await this.catalog.deactivatePackage(id);
  }
}
