import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';

/**
 * Thin wrapper around a Zod schema. Throws ZodError on failure, which is
 * mapped to RFC 7807 problem+json by AllExceptionsFilter.
 *
 * Usage:
 *   @Body(new ZodValidationPipe(CreateOrderSchema)) body: CreateOrderDto
 *
 * For full nestjs-zod integration (DTO classes + Swagger generation),
 * see `nestjs-zod` docs — both patterns coexist.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    return this.schema.parse(value);
  }
}
