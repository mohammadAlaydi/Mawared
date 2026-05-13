import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const base = {
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
  nameAr: z.string().trim().min(1).max(200),
  nameEn: z.string().trim().max(200).optional(),
  descriptionAr: z.string().trim().max(2000).optional(),
  descriptionEn: z.string().trim().max(2000).optional(),
  profession: z.enum(['DOMESTIC_WORKER', 'DRIVER', 'CAREGIVER_ELDERLY', 'CAREGIVER_CHILD']),
  displayOrder: z.coerce.number().int().min(0).max(1000).default(0),
  isActive: z.boolean().default(true),
};

export const CreateServiceSchema = z.object(base).strict();
export class CreateServiceDto extends createZodDto(CreateServiceSchema) {}

export const UpdateServiceSchema = z.object(base).partial().strict();
export class UpdateServiceDto extends createZodDto(UpdateServiceSchema) {}
