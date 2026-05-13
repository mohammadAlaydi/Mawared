import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ERROR_CODES, type ErrorCode } from '@mawared/shared-types';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';

/**
 * RFC 7807 problem+json error formatting + structured `code` field.
 * Every error response has the same shape:
 *
 *   {
 *     "type": "about:blank",
 *     "title": "Bad Request",
 *     "status": 400,
 *     "code": "VALIDATION_FAILED",
 *     "detail": "...",
 *     "instance": "/v1/orders",
 *     "requestId": "...",
 *     "errors"?: [...]   // optional, for validation failures
 *   }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();
    const requestId = (request.id as string | undefined) ?? request.headers['x-request-id'];

    const { status, code, title, detail, errors } = this.normalize(exception);

    if (status >= 500) {
      this.logger.error(
        { err: exception, requestId, path: request.url },
        'Unhandled exception',
      );
    }

    response.status(status).type('application/problem+json').json({
      type: 'about:blank',
      title,
      status,
      code,
      detail,
      instance: request.url,
      requestId,
      ...(errors && { errors }),
    });
  }

  private normalize(exception: unknown): {
    status: number;
    code: ErrorCode;
    title: string;
    detail: string;
    errors?: Array<{ path: string; message: string }>;
  } {
    if (exception instanceof ZodError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        code: ERROR_CODES.VALIDATION_FAILED,
        title: 'Bad Request',
        detail: 'Request validation failed.',
        errors: exception.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const payload: { code?: string; message?: string | string[]; detail?: string } =
        typeof res === 'string' ? { message: res } : (res as Record<string, unknown>);
      const code =
        (payload.code as ErrorCode | undefined) ?? this.defaultCodeForStatus(status);
      const detail = Array.isArray(payload.message)
        ? payload.message.join('; ')
        : (payload.detail ?? payload.message ?? exception.message);
      return {
        status,
        code,
        title: HttpStatus[status] ?? 'Error',
        detail: String(detail),
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.INTERNAL_ERROR,
      title: 'Internal Server Error',
      detail: 'An unexpected error occurred.',
    };
  }

  private defaultCodeForStatus(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return ERROR_CODES.AUTH_UNAUTHENTICATED;
      case HttpStatus.FORBIDDEN:
        return ERROR_CODES.AUTH_FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ERROR_CODES.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ERROR_CODES.CONFLICT;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ERROR_CODES.RATE_LIMITED;
      case HttpStatus.BAD_REQUEST:
        return ERROR_CODES.VALIDATION_FAILED;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ERROR_CODES.SERVICE_UNAVAILABLE;
      default:
        return ERROR_CODES.INTERNAL_ERROR;
    }
  }
}
