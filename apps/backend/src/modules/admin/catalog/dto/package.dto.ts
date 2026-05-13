import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const base = {
  serviceId: z.string().uuid(),
  nameAr: z.string().trim().min(1).max(200),
  nameEn: z.string().trim().max(200).optional(),
  descriptionAr: z.string().trim().max(2000).optional(),
  descriptionEn: z.string().trim().max(2000).optional(),
  type: z.enum(['HOURLY', 'MONTHLY']),
  durationValue: z.coerce.number().int().positive().max(365),
  durationUnit: z.enum(['HOUR', 'DAY', 'WEEK', 'MONTH']),
  priceMinor: z.coerce.bigint().nonnegative(),
  currency: z.string().length(3).transform((s) => s.toUpperCase()).default('SAR'),
  vatRatePpm: z.coerce.number().int().min(0).max(1_000_000).default(150_000),
  features: z.array(z.object({ ar: z.string(), en: z.string().optional() })).default([]),
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
};

export const CreatePackageSchema = z.object(base).strict();
export class CreatePackageDto extends createZodDto(CreatePackageSchema) {}

export const UpdatePackageSchema = z
  .object({ ...base, serviceId: base.serviceId.optional() })
  .partial()
  .strict();
export class UpdatePackageDto extends createZodDto(UpdatePackageSchema) {}
