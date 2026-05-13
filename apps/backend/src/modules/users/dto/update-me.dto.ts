import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const UpdateMeSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    preferredLocale: z.enum(['ar', 'en']).optional(),
    notificationPrefs: z
      .object({
        push: z.boolean().optional(),
        email: z.boolean().optional(),
        sms: z.boolean().optional(),
      })
      .partial()
      .optional(),
  })
  .strict();

export class UpdateMeDto extends createZodDto(UpdateMeSchema) {}
