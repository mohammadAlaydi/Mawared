import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { E164_REGEX } from './otp-request.dto';

export const PhoneCheckSchema = z
  .object({
    phone: z.string().regex(E164_REGEX, 'phone must be E.164 (e.g. +9665XXXXXXXX)'),
  })
  .strict();

export class PhoneCheckDto extends createZodDto(PhoneCheckSchema) {}
