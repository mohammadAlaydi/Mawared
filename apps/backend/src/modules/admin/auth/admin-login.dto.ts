import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const AdminLoginSchema = z
  .object({
    email: z.string().email().transform((s) => s.toLowerCase()),
    password: z.string().min(8).max(200),
    deviceId: z.string().uuid(),
    totp: z.string().regex(/^\d{6}$/).optional(),
  })
  .strict();

export class AdminLoginDto extends createZodDto(AdminLoginSchema) {}
