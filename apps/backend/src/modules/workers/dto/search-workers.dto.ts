import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { CursorPaginationSchema } from '@/common/pagination';

export const SearchWorkersSchema = CursorPaginationSchema.extend({
  profession: z
    .enum(['DOMESTIC_WORKER', 'DRIVER', 'CAREGIVER_ELDERLY', 'CAREGIVER_CHILD'])
    .optional(),
  nationalityCode: z
    .string()
    .length(2)
    .transform((s) => s.toUpperCase())
    .optional(),
  languageCode: z
    .string()
    .min(2)
    .max(5)
    .transform((s) => s.toLowerCase())
    .optional(),
  minSalaryMinor: z.coerce.bigint().nonnegative().optional(),
  maxSalaryMinor: z.coerce.bigint().nonnegative().optional(),
  minAge: z.coerce.number().int().min(18).max(80).optional(),
  maxAge: z.coerce.number().int().min(18).max(80).optional(),
  minExperienceYears: z.coerce.number().int().min(0).max(60).optional(),
  branchId: z.string().uuid().optional(),
  query: z.string().trim().min(1).max(80).optional(),
  sort: z.enum(['price_asc', 'price_desc', 'rating_desc', 'newest']).default('newest'),
}).strict();

export class SearchWorkersDto extends createZodDto(SearchWorkersSchema) {}
