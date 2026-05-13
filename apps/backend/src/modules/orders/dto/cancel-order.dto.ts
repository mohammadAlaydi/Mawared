import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CancelOrderSchema = z
  .object({
    reason: z.enum(['CUSTOMER_REQUEST', 'STAFF_DECISION']).default('CUSTOMER_REQUEST'),
    note: z.string().trim().max(400).optional(),
  })
  .strict();

export class CancelOrderDto extends createZodDto(CancelOrderSchema) {}
