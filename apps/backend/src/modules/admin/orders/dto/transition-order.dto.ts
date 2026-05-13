import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const AdminTransitionOrderSchema = z
  .object({
    event: z.enum([
      'submitForReview',
      'confirm',
      'startService',
      'complete',
      'cancel',
    ]),
    note: z.string().trim().max(400).optional(),
  })
  .strict();

export class AdminTransitionOrderDto extends createZodDto(AdminTransitionOrderSchema) {}
