import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreatePaymentIntentSchema = z
  .object({
    orderId: z.string().uuid(),
  })
  .strict();

export class CreatePaymentIntentDto extends createZodDto(CreatePaymentIntentSchema) {}
