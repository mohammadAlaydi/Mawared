import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const base = {
  code: z.string().trim().min(2).max(40).transform((s) => s.toUpperCase()),
  titleAr: z.string().trim().min(1).max(200),
  titleEn: z.string().trim().max(200).optional(),
  descriptionAr: z.string().trim().max(1000).optional(),
  descriptionEn: z.string().trim().max(1000).optional(),
  discountPercent: z.coerce.number().int().min(1).max(100).optional(),
  discountMinor: z.coerce.bigint().nonnegative().optional(),
  currency: z.string().length(3).transform((s) => s.toUpperCase()).default('SAR'),
  maxUsesTotal: z.coerce.number().int().positive().nullable().optional(),
  maxUsesPerUser: z.coerce.number().int().positive().default(1),
  minOrderMinor: z.coerce.bigint().nonnegative().default(0n),
  validFrom: z.coerce.date(),
  validUntil: z.coerce.date(),
  isActive: z.boolean().default(true),
};

export const CreatePromoSchema = z
  .object(base)
  .strict()
  .refine(
    (p) =>
      (p.discountPercent !== undefined && p.discountMinor === undefined) ||
      (p.discountPercent === undefined && p.discountMinor !== undefined),
    { message: 'Exactly one of discountPercent / discountMinor must be set' },
  )
  .refine((p) => p.validUntil > p.validFrom, {
    message: 'validUntil must be after validFrom',
  });
export class CreatePromoDto extends createZodDto(CreatePromoSchema) {}

export const UpdatePromoSchema = z.object(base).partial().strict();
export class UpdatePromoDto extends createZodDto(UpdatePromoSchema) {}
