import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const base = {
  email: z.string().email().transform((s) => s.toLowerCase()),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  title: z.string().trim().max(80).optional(),
  role: z.enum(['STAFF', 'BRANCH_MANAGER', 'SUPER_ADMIN']),
  branchId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
};

export const CreateStaffSchema = z
  .object({
    ...base,
    password: z.string().min(12).max(200),
  })
  .strict();
export class CreateStaffDto extends createZodDto(CreateStaffSchema) {}

export const UpdateStaffSchema = z
  .object({
    ...base,
    password: z.string().min(12).max(200).optional(),
  })
  .partial()
  .strict();
export class UpdateStaffDto extends createZodDto(UpdateStaffSchema) {}
