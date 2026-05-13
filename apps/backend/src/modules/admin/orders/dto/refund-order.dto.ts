import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const RefundOrderSchema = z
  .object({
    amountMinor: z.coerce.bigint().nonnegative().optional(),
    reason: z.string().trim().max(200).optional(),
  })
  .strict();

export class RefundOrderDto extends createZodDto(RefundOrderSchema) {}
