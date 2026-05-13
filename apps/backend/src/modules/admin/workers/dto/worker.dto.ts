import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const base = {
  branchId: z.string().uuid(),
  nationalityId: z.string().uuid(),
  fullNameAr: z.string().trim().min(1).max(120),
  fullNameEn: z.string().trim().max(120).optional(),
  profession: z.enum(['DOMESTIC_WORKER', 'DRIVER', 'CAREGIVER_ELDERLY', 'CAREGIVER_CHILD']),
  ageYears: z.coerce.number().int().min(18).max(80),
  experienceYears: z.coerce.number().int().min(0).max(60),
  bioAr: z.string().trim().min(1).max(4000),
  bioEn: z.string().trim().max(4000).optional(),
  monthlySalaryMinor: z.coerce.bigint().nonnegative(),
  currency: z.string().length(3).transform((s) => s.toUpperCase()).default('SAR'),
  availability: z.enum(['AVAILABLE', 'RESERVED', 'BOOKED', 'ARCHIVED']).default('AVAILABLE'),
};

export const CreateWorkerSchema = z.object(base).strict();
export class CreateWorkerDto extends createZodDto(CreateWorkerSchema) {}

export const UpdateWorkerSchema = z.object(base).partial().strict();
export class UpdateWorkerDto extends createZodDto(UpdateWorkerSchema) {}
