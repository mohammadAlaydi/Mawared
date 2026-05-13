import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { Roles } from '@/common/decorators/roles.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { AuditService } from '@/shared/audit/audit.service';

const AuditQuerySchema = z
  .object({
    entityType: z.string().min(1).max(40).optional(),
    entityId: z.string().uuid().optional(),
    actorId: z.string().uuid().optional(),
    action: z.string().min(1).max(80).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  })
  .strict();

@ApiTags('admin-audit')
@ApiBearerAuth()
@Roles('SUPER_ADMIN')
@Controller({ path: 'admin/audit', version: '1' })
export class AdminAuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  query(@Query(new ZodValidationPipe(AuditQuerySchema)) q: z.infer<typeof AuditQuerySchema>) {
    return this.audit.query(q);
  }
}
