import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const ReportsQuerySchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
    branchId: z.string().uuid().optional(),
  })
  .strict()
  .refine((q) => q.to > q.from, { message: 'to must be after from' })
  .refine((q) => q.to.getTime() - q.from.getTime() <= 366 * 24 * 3600 * 1000, {
    message: 'date range max 1 year',
  });

export class ReportsQueryDto extends createZodDto(ReportsQuerySchema) {}
