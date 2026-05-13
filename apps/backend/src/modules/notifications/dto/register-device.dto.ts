import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const RegisterDeviceSchema = z
  .object({
    token: z.string().min(20).max(500),
    platform: z.enum(['ANDROID', 'IOS', 'WEB']).default('ANDROID'),
    appVersion: z.string().max(40).optional(),
    locale: z.enum(['ar', 'en']).optional(),
  })
  .strict();

export class RegisterDeviceDto extends createZodDto(RegisterDeviceSchema) {}
