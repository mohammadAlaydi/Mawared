import { z } from 'zod';

/**
 * Cursor pagination — never offset.
 * `cursor` is the id of the last item from the previous page.
 */
export const CursorPaginationSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CursorPagination = z.infer<typeof CursorPaginationSchema>;

export interface Paged<T> {
  items: T[];
  nextCursor: string | null;
}

export function buildPage<T extends { id: string }>(
  rows: T[],
  limit: number,
): Paged<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return {
    items,
    nextCursor: hasMore ? items[items.length - 1]!.id : null,
  };
}
