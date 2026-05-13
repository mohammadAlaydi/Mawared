import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateOrderSchema = z
  .object({
    workerId: z.string().uuid(),
    packageId: z.string().uuid(),
    addressId: z.string().uuid(),
    promoCode: z.string().trim().min(1).max(40).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .strict();

export class CreateOrderDto extends createZodDto(CreateOrderSchema) {}
