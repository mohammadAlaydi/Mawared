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
import { AdminPromosService } from './admin-promos.service';
import {
  CreatePromoDto,
  CreatePromoSchema,
  UpdatePromoDto,
  UpdatePromoSchema,
} from './dto/promo.dto';

@ApiTags('admin-promos')
@ApiBearerAuth()
@Roles('SUPER_ADMIN')
@UseInterceptors(AuditInterceptor)
@Controller({ path: 'admin/promos', version: '1' })
export class AdminPromosController {
  constructor(private readonly promos: AdminPromosService) {}

  @Get()
  list() { return this.promos.list(); }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.promos.findById(id);
  }

  @Post()
  @Audit({ action: 'promo.create', entityType: 'PromoCode', entityIdFrom: 'body', entityIdKey: 'code' })
  create(@Body(new ZodValidationPipe(CreatePromoSchema)) body: CreatePromoDto) {
    return this.promos.create(body);
  }

  @Patch(':id')
  @Audit({ action: 'promo.update', entityType: 'PromoCode' })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(UpdatePromoSchema)) body: UpdatePromoDto,
  ) {
    return this.promos.update(id, body);
  }

  @Post(':id/deactivate')
  @HttpCode(204)
  @Audit({ action: 'promo.deactivate', entityType: 'PromoCode' })
  async deactivate(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<void> {
    await this.promos.deactivate(id);
  }
}
