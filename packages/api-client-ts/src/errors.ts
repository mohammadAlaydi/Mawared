import type { ErrorCode } from '@mawared/shared-types';

/**
 * Thrown when the API returns a non-2xx RFC 7807 problem+json response.
 * `code` is one of the canonical ERROR_CODES; UI code switches on it.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode | string,
    public readonly detail: string,
    public readonly requestId?: string,
    public readonly errors?: Array<{ path: string; message: string }>,
  ) {
    super(`[${status} ${code}] ${detail}`);
    this.name = 'ApiError';
  }

  static fromResponse(status: number, body: unknown): ApiError {
    const b = (body ?? {}) as {
      code?: string;
      detail?: string;
      title?: string;
      requestId?: string;
      errors?: Array<{ path: string; message: string }>;
    };
    return new ApiError(
      status,
      b.code ?? 'UNKNOWN',
      b.detail ?? b.title ?? `HTTP ${status}`,
      b.requestId,
      b.errors,
    );
  }
}

/** Thrown when the network request itself fails (DNS, TLS, abort). */
export class NetworkError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'NetworkError';
  }
}
