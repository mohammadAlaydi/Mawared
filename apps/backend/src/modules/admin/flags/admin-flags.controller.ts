import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { CurrentUser, type AuthUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { FeatureFlagsService } from '@/shared/feature-flags/feature-flags.service';

const UpdateFlagSchema = z
  .object({
    key: z
      .string()
      .min(2)
      .max(80)
      .regex(/^[a-z][a-z0-9_]*$/, 'snake_case lower'),
    enabled: z.boolean(),
    rules: z
      .object({
        rolloutPercent: z.number().int().min(0).max(100).optional(),
        userIds: z.array(z.string().uuid()).max(1000).optional(),
        roles: z
          .array(z.enum(['CUSTOMER', 'STAFF', 'BRANCH_MANAGER', 'SUPER_ADMIN']))
          .optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

type UpdateFlagDto = z.infer<typeof UpdateFlagSchema>;

@ApiTags('admin-flags')
@ApiBearerAuth()
@Roles('SUPER_ADMIN')
@Controller({ path: 'admin/flags', version: '1' })
export class AdminFlagsController {
  constructor(private readonly flags: FeatureFlagsService) {}

  @Get()
  list() {
    return this.flags.listAll().then((items) => ({ items }));
  }

  @Post()
  @HttpCode(200)
  async update(
    @CurrentUser() actor: AuthUser,
    @Body(new ZodValidationPipe(UpdateFlagSchema)) body: UpdateFlagDto,
  ) {
    await this.flags.setFlag(body.key, body.enabled, body.rules, actor.id);
    return { key: body.key, enabled: body.enabled, rules: body.rules ?? null };
  }
}
