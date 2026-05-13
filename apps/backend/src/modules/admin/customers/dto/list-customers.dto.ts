import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { CursorPaginationSchema } from '@/common/pagination';

export const ListCustomersSchema = CursorPaginationSchema.extend({
  // Free-text query — currently substring-matches the customer phone number.
  // Kept as `q` for backwards compatibility with the original endpoint shape.
  q: z.string().trim().max(40).optional(),
}).strict();

export class ListCustomersDto extends createZodDto(ListCustomersSchema) {}
