import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// E.164: +<country><number> — 7..15 digits after the leading + and country digit.
export const E164_REGEX = /^\+[1-9][0-9]{6,14}$/;

export const OtpRequestSchema = z
  .object({
    phone: z.string().regex(E164_REGEX, 'phone must be E.164 (e.g. +9665XXXXXXXX)'),
    locale: z.enum(['ar', 'en']).default('ar'),
  })
  .strict();

export class OtpRequestDto extends createZodDto(OtpRequestSchema) {}
