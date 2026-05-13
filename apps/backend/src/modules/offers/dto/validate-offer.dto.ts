import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const ValidateOfferSchema = z
  .object({
    code: z.string().trim().min(1).max(40).transform((s) => s.toUpperCase()),
    subtotalMinor: z.coerce.bigint().nonnegative(),
    currency: z.string().length(3).transform((s) => s.toUpperCase()),
  })
  .strict();

export class ValidateOfferDto extends createZodDto(ValidateOfferSchema) {}
