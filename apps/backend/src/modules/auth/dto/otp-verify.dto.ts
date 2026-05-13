import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { E164_REGEX } from './otp-request.dto';

export const OtpVerifySchema = z
  .object({
    phone: z.string().regex(E164_REGEX),
    code: z.string().regex(/^\d{6}$/, 'code must be 6 digits'),
    deviceId: z.string().uuid('deviceId must be a UUID'),
    deviceName: z.string().max(80).optional(),
  })
  .strict();

export class OtpVerifyDto extends createZodDto(OtpVerifySchema) {}
