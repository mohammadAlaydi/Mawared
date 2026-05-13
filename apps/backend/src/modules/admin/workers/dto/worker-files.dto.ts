import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const BindWorkerPhotoSchema = z
  .object({ fileId: z.string().uuid() })
  .strict();
export class BindWorkerPhotoDto extends createZodDto(BindWorkerPhotoSchema) {}

export const BindWorkerDocumentSchema = z
  .object({
    fileId: z.string().uuid(),
    kind: z.enum(['PASSPORT', 'MEDICAL_CERT', 'POLICE_CLEARANCE', 'OTHER']),
    expiresAt: z.coerce.date().optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .strict();
export class BindWorkerDocumentDto extends createZodDto(BindWorkerDocumentSchema) {}
