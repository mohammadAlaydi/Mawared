import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateLeadSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    phone: z.string().regex(/^\+[1-9][0-9]{6,14}$/, 'phone must be E.164'),
    email: z.string().email().optional(),
    message: z.string().trim().min(2).max(2000),
    source: z.string().trim().max(120).optional(),
  })
  .strict();

export class CreateLeadDto extends createZodDto(CreateLeadSchema) {}
