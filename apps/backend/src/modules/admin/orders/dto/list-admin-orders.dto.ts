import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ORDER_STATUSES } from '@mawared/shared-types';
import { CursorPaginationSchema } from '@/common/pagination';

export const ListAdminOrdersSchema = CursorPaginationSchema.extend({
  status: z.enum(ORDER_STATUSES).optional(),
  branchId: z.string().uuid().optional(),
  customerPhone: z.string().regex(/^\+[1-9][0-9]{6,14}$/).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
}).strict();

export class ListAdminOrdersDto extends createZodDto(ListAdminOrdersSchema) {}
