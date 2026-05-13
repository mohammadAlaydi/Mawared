import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/**
 * Optional branch filter for dashboard rollup endpoints. Branch managers are
 * automatically scoped to their own branch; providing this is only meaningful
 * for STAFF / SUPER_ADMIN slicing across branches.
 */
export const OverviewQuerySchema = z
  .object({
    branchId: z.string().uuid().optional(),
  })
  .strict();

export class OverviewQueryDto extends createZodDto(OverviewQuerySchema) {}
