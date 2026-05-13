import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const RequestUploadUrlSchema = z
  .object({
    scope: z.enum([
      'WORKER_PHOTO',
      'WORKER_DOCUMENT',
      'CUSTOMER_ID',
      'CONTRACT_PDF',
      'BRANCH_PHOTO',
      'SERVICE_ICON',
    ]),
    mimeType: z
      .string()
      .regex(/^[a-z]+\/[a-z0-9.+-]+$/, 'mimeType must be like image/jpeg'),
    sizeBytes: z.coerce.number().int().positive().max(50 * 1024 * 1024),
  })
  .strict();

export class RequestUploadUrlDto extends createZodDto(RequestUploadUrlSchema) {}

export const FinalizeFileSchema = z
  .object({
    fileId: z.string().uuid(),
  })
  .strict();

export class FinalizeFileDto extends createZodDto(FinalizeFileSchema) {}
