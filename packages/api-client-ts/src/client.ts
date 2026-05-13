import { ApiError, NetworkError } from './errors';
import type {
  Address,
  AdminActiveWorkersResponse,
  AdminCustomer,
  AdminOrdersByStatusReport,
  AdminRefundsReport,
  AdminRevenueReport,
  AdminCustomerDetail,
  AdminOverviewResponse,
  AdminPaymentIntent,
  AdminRefund,
  AdminStaff,
  CustomerContract,
  FileSignedUrl,
  AuthResponse,
  Branch,
  CreateOrderInput,
  FeatureFlag,
  Nationality,
  Notification,
  Offer,
  Order,
  Paged,
  PaymentIntentResponse,
  PromoValidation,
  PublicStats,
  SearchWorkersQuery,
  ServiceCategory,
  ServicePackage,
  Worker,
} from './types';

export interface MawaredClientOptions {
  baseUrl: string;
  /** Called whenever the API responds with a fresh access token (post-refresh). */
  onTokenRefresh?: (accessToken: string, refreshToken: string) => void;
  /** Returns the latest access token; called on every request. */
  getAccessToken?: () => string | null | Promise<string | null>;
  /** Returns the latest refresh token; used to auto-refresh on 401. */
  getRefreshToken?: () => string | null | Promise<string | null>;
  /** UUID v4 stable per device install. */
  deviceId?: string;
  fetchImpl?: typeof fetch;
  /** Override the idempotency-key generator (defaults to crypto.randomUUID). */
  idempotencyKeyFactory?: () => string;
}

/**
 * Hand-written fetch client mirroring the OpenAPI surface of the Mawared
 * backend. Auto-refreshes access tokens on 401 (single-flight). Throws
 * ApiError for RFC 7807 responses, NetworkError for transport failures.
 *
 * Designed to be importable from both the Next.js admin dashboard and
 * the Next.js marketing website. The Android app has its own Kotlin
 * client in packages/api-client-kotlin.
 */
export class MawaredClient {
  private refreshing?: Promise<string | null>;

  constructor(private readonly opts: MawaredClientOptions) {}

  // ===== Auth =====

  auth = {
    requestOtp: (phone: string, locale: 'ar' | 'en' = 'ar') =>
      this.req<void>('POST', '/v1/auth/otp/request', { phone, locale }),

    verifyOtp: (phone: string, code: string, deviceId?: string, deviceName?: string) =>
      this.req<AuthResponse>('POST', '/v1/auth/otp/verify', {
        phone,
        code,
        deviceId: deviceId ?? this.opts.deviceId,
        deviceName,
      }),

    refresh: (refreshToken: string) =>
      this.req<AuthResponse>('POST', '/v1/auth/token/refresh', { refreshToken }),

    logout: (refreshToken: string) =>
      this.req<void>('POST', '/v1/auth/logout', { refreshToken }),

    listSessions: () =>
      this.req<{ items: Array<{ id: string; deviceName?: string; lastSeenAt: string }> }>(
        'GET',
        '/v1/auth/sessions',
      ),

    revokeSession: (id: string) => this.req<void>('DELETE', `/v1/auth/sessions/${id}`),
  };

  // ===== Admin auth =====

  adminAuth = {
    login: (email: string, password: string, deviceId: string, totp?: string) =>
      this.req<AuthResponse>('POST', '/v1/admin/auth/login', {
        email,
        password,
        deviceId,
        totp,
      }),
    totp: {
      enroll: () =>
        this.req<{ secret: string; otpauthUri: string }>('POST', '/v1/admin/auth/totp/enroll'),
      verify: (code: string) =>
        this.req<void>('POST', '/v1/admin/auth/totp/verify', { code }),
      disable: (code: string) =>
        this.req<void>('POST', '/v1/admin/auth/totp/disable', { code }),
    },
  };

  // ===== Profile =====

  me = {
    get: () => this.req<unknown>('GET', '/v1/me'),
    update: (body: { firstName?: string; lastName?: string; preferredLocale?: 'ar' | 'en' }) =>
      this.req<unknown>('PATCH', '/v1/me', body),
    delete: () => this.req<{ status: 'scheduled'; etaDays: number }>('DELETE', '/v1/me'),
    addresses: {
      list: () => this.req<{ items: Address[] }>('GET', '/v1/me/addresses'),
      create: (body: Omit<Address, 'id' | 'isDefault'> & { isDefault?: boolean }) =>
        this.req<Address>('POST', '/v1/me/addresses', body),
      update: (id: string, body: Partial<Address>) =>
        this.req<Address>('PATCH', `/v1/me/addresses/${id}`, body),
      delete: (id: string) => this.req<void>('DELETE', `/v1/me/addresses/${id}`),
    },
    favorites: {
      list: () => this.req<{ items: Worker[] }>('GET', '/v1/me/favorites'),
      add: (workerId: string) => this.req<void>('POST', `/v1/me/favorites/${workerId}`),
      remove: (workerId: string) => this.req<void>('DELETE', `/v1/me/favorites/${workerId}`),
    },
    verification: {
      get: () => this.req<{ status: string; expiresAt: string | null }>('GET', '/v1/me/verification'),
      start: () => this.req<{ redirectUrl: string; sessionId: string }>('POST', '/v1/me/verification/start'),
    },
    contracts: {
      list: () => this.req<{ items: CustomerContract[] }>('GET', '/v1/me/contracts'),
    },
  };

  // ===== Workers / catalog =====

  workers = {
    search: (q: SearchWorkersQuery = {}) =>
      this.req<Paged<Worker>>('GET', this.qs('/v1/workers', q)),
    findById: (id: string) => this.req<Worker>('GET', `/v1/workers/${id}`),
  };

  catalog = {
    services: () => this.req<{ items: ServiceCategory[] }>('GET', '/v1/services'),
    packages: (serviceId: string) =>
      this.req<{ items: ServicePackage[] }>('GET', `/v1/services/${serviceId}/packages`),
  };

  branches = {
    list: () => this.req<{ items: Branch[] }>('GET', '/v1/branches'),
    findById: (id: string) => this.req<Branch>('GET', `/v1/branches/${id}`),
  };

  nationalities = {
    list: () => this.req<{ items: Nationality[] }>('GET', '/v1/nationalities'),
  };

  offers = {
    list: () => this.req<{ items: Offer[] }>('GET', '/v1/offers'),
    validate: (body: { code: string; subtotalMinor: string; currency: string }) =>
      this.req<PromoValidation>('POST', '/v1/offers/validate', body),
  };

  // ===== Orders / payments =====

  orders = {
    create: (body: CreateOrderInput, idempotencyKey?: string) =>
      this.req<Order>('POST', '/v1/orders', body, {
        'Idempotency-Key': idempotencyKey ?? this.newIdempotencyKey(),
      }),
    list: () => this.req<{ items: Order[] }>('GET', '/v1/orders'),
    findById: (id: string) => this.req<Order>('GET', `/v1/orders/${id}`),
    cancel: (id: string, reason?: 'CUSTOMER_REQUEST' | 'STAFF_DECISION', note?: string) =>
      this.req<{ from: string; to: string }>('POST', `/v1/orders/${id}/cancel`, { reason, note }),
    contract: (id: string) =>
      this.req<{
        id: string;
        contractNumber: string;
        status: string;
        pdfFile?: { bucket: string; key: string; status: string };
      }>('GET', `/v1/orders/${id}/contract`),
  };

  payments = {
    createIntent: (orderId: string, idempotencyKey?: string) =>
      this.req<PaymentIntentResponse>(
        'POST',
        '/v1/payments/intents',
        { orderId },
        { 'Idempotency-Key': idempotencyKey ?? this.newIdempotencyKey() },
      ),
  };

  // ===== Notifications =====

  notifications = {
    list: () => this.req<{ items: Notification[] }>('GET', '/v1/notifications'),
    markRead: (id: string) => this.req<void>('PATCH', `/v1/notifications/${id}/read`),
    registerDevice: (body: { token: string; platform: 'ANDROID' | 'IOS' | 'WEB'; appVersion?: string; locale?: string }) =>
      this.req<void>('POST', '/v1/devices', body),
    unregisterDevice: (token: string) => this.req<void>('DELETE', `/v1/devices/${token}`),
  };

  // ===== Admin =====

  admin = {
    orders: {
      list: (q: Record<string, string | number | undefined> = {}) =>
        this.req<Paged<Order>>('GET', this.qs('/v1/admin/orders', q)),
      findById: (id: string) => this.req<Order>('GET', `/v1/admin/orders/${id}`),
      transition: (id: string, body: { event: string; note?: string }, idempotencyKey?: string) =>
        this.req<{ from: string; to: string }>(
          'POST',
          `/v1/admin/orders/${id}/transition`,
          body,
          { 'Idempotency-Key': idempotencyKey ?? this.newIdempotencyKey() },
        ),
      refund: (id: string, body: { amountMinor?: string; reason?: string }, idempotencyKey?: string) =>
        this.req<{ refundId: string; status: string }>(
          'POST',
          `/v1/admin/orders/${id}/refund`,
          body,
          { 'Idempotency-Key': idempotencyKey ?? this.newIdempotencyKey() },
        ),
    },
    workers: {
      list: (q: Record<string, string | number | undefined> = {}) =>
        this.req<Paged<Worker>>('GET', this.qs('/v1/admin/workers', q)),
      findById: (id: string) => this.req<Worker>('GET', `/v1/admin/workers/${id}`),
      create: (body: Partial<Worker>, idempotencyKey?: string) =>
        this.req<Worker>('POST', '/v1/admin/workers', body, {
          'Idempotency-Key': idempotencyKey ?? this.newIdempotencyKey(),
        }),
      update: (id: string, body: Partial<Worker>, idempotencyKey?: string) =>
        this.req<Worker>('PATCH', `/v1/admin/workers/${id}`, body, {
          'Idempotency-Key': idempotencyKey ?? this.newIdempotencyKey(),
        }),
      delete: (id: string) => this.req<void>('DELETE', `/v1/admin/workers/${id}`),
      bindPhoto: (id: string, fileId: string) =>
        this.req<unknown>('POST', `/v1/admin/workers/${id}/photo`, { fileId }),
      addDocument: (id: string, body: { fileId: string; kind: string; expiresAt?: string }) =>
        this.req<unknown>('POST', `/v1/admin/workers/${id}/documents`, body),
    },
    customers: {
      list: (q: { q?: string; cursor?: string; limit?: number } = {}) =>
        this.req<Paged<AdminCustomer>>('GET', this.qs('/v1/admin/customers', q)),
      findById: (id: string) =>
        this.req<AdminCustomerDetail>('GET', `/v1/admin/customers/${id}`),
      suspend: (id: string) => this.req<void>('POST', `/v1/admin/customers/${id}/suspend`),
      reactivate: (id: string) => this.req<void>('POST', `/v1/admin/customers/${id}/reactivate`),
      verification: {
        get: (customerId: string) =>
          this.req<{ status: string; history: unknown[] }>(
            'GET',
            `/v1/admin/customers/${customerId}/verification`,
          ),
        override: (
          customerId: string,
          body: { status: 'VERIFIED' | 'FAILED' | 'NOT_VERIFIED'; reason?: string },
          idempotencyKey?: string,
        ) =>
          this.req<void>(
            'POST',
            `/v1/admin/customers/${customerId}/verification/override`,
            body,
            { 'Idempotency-Key': idempotencyKey ?? this.newIdempotencyKey() },
          ),
      },
    },
    catalog: {
      services: {
        list: () => this.req<{ items: ServiceCategory[] }>('GET', '/v1/admin/services'),
        findById: (id: string) => this.req<ServiceCategory>('GET', `/v1/admin/services/${id}`),
        create: (body: Partial<ServiceCategory>, idempotencyKey?: string) =>
          this.req<ServiceCategory>('POST', '/v1/admin/services', body, {
            'Idempotency-Key': idempotencyKey ?? this.newIdempotencyKey(),
          }),
        update: (id: string, body: Partial<ServiceCategory>, idempotencyKey?: string) =>
          this.req<ServiceCategory>('PATCH', `/v1/admin/services/${id}`, body, {
            'Idempotency-Key': idempotencyKey ?? this.newIdempotencyKey(),
          }),
        deactivate: (id: string) =>
          this.req<void>('POST', `/v1/admin/services/${id}/deactivate`),
      },
      packages: {
        list: (q: { serviceId?: string } = {}) =>
          this.req<{ items: ServicePackage[] }>('GET', this.qs('/v1/admin/packages', q)),
        findById: (id: string) => this.req<ServicePackage>('GET', `/v1/admin/packages/${id}`),
        create: (body: Partial<ServicePackage>, idempotencyKey?: string) =>
          this.req<ServicePackage>('POST', '/v1/admin/packages', body, {
            'Idempotency-Key': idempotencyKey ?? this.newIdempotencyKey(),
          }),
        update: (id: string, body: Partial<ServicePackage>, idempotencyKey?: string) =>
          this.req<ServicePackage>('PATCH', `/v1/admin/packages/${id}`, body, {
            'Idempotency-Key': idempotencyKey ?? this.newIdempotencyKey(),
          }),
        deactivate: (id: string) =>
          this.req<void>('POST', `/v1/admin/packages/${id}/deactivate`),
      },
    },
    payments: {
      list: (q: { cursor?: string; limit?: number; status?: string; orderId?: string; from?: string; to?: string } = {}) =>
        this.req<Paged<AdminPaymentIntent>>('GET', this.qs('/v1/admin/payments', q)),
      findById: (id: string) =>
        this.req<AdminPaymentIntent>('GET', `/v1/admin/payments/${id}`),
      refunds: (q: { cursor?: string; limit?: number; status?: string; from?: string; to?: string } = {}) =>
        this.req<Paged<AdminRefund>>('GET', this.qs('/v1/admin/payments/refunds', q)),
    },
    promos: {
      list: () => this.req<{ items: Offer[] }>('GET', '/v1/admin/promos'),
      findById: (id: string) => this.req<Offer>('GET', `/v1/admin/promos/${id}`),
      create: (body: Partial<Offer> & { code: string }, idempotencyKey?: string) =>
        this.req<Offer>('POST', '/v1/admin/promos', body, {
          'Idempotency-Key': idempotencyKey ?? this.newIdempotencyKey(),
        }),
      update: (id: string, body: Partial<Offer>, idempotencyKey?: string) =>
        this.req<Offer>('PATCH', `/v1/admin/promos/${id}`, body, {
          'Idempotency-Key': idempotencyKey ?? this.newIdempotencyKey(),
        }),
      deactivate: (id: string) => this.req<void>('POST', `/v1/admin/promos/${id}/deactivate`),
    },
    staff: {
      list: () => this.req<{ items: AdminStaff[] }>('GET', '/v1/admin/staff'),
      findById: (id: string) => this.req<AdminStaff>('GET', `/v1/admin/staff/${id}`),
      create: (
        body: { email: string; password: string; fullName: string; role: AdminStaff['role']; branchId?: string },
        idempotencyKey?: string,
      ) =>
        this.req<AdminStaff>('POST', '/v1/admin/staff', body, {
          'Idempotency-Key': idempotencyKey ?? this.newIdempotencyKey(),
        }),
      update: (id: string, body: Partial<AdminStaff>, idempotencyKey?: string) =>
        this.req<AdminStaff>('PATCH', `/v1/admin/staff/${id}`, body, {
          'Idempotency-Key': idempotencyKey ?? this.newIdempotencyKey(),
        }),
      deactivate: (id: string) =>
        this.req<void>('POST', `/v1/admin/staff/${id}/deactivate`),
    },
    reports: {
      revenue: (from: string, to: string, branchId?: string) =>
        this.req<AdminRevenueReport>(
          'GET',
          this.qs('/v1/admin/reports/revenue', { from, to, branchId }),
        ),
      ordersByStatus: (from: string, to: string, branchId?: string) =>
        this.req<AdminOrdersByStatusReport>(
          'GET',
          this.qs('/v1/admin/reports/orders', { from, to, branchId }),
        ),
      refunds: (from: string, to: string, branchId?: string) =>
        this.req<AdminRefundsReport>(
          'GET',
          this.qs('/v1/admin/reports/refunds', { from, to, branchId }),
        ),
      overview: (branchId?: string) =>
        this.req<AdminOverviewResponse>('GET', this.qs('/v1/admin/reports/overview', { branchId })),
      activeWorkers: (branchId?: string) =>
        this.req<AdminActiveWorkersResponse>(
          'GET',
          this.qs('/v1/admin/reports/active-workers', { branchId }),
        ),
    },
    files: {
      uploadUrl: (body: { scope: string; mimeType: string; sizeBytes: number }) =>
        this.req<{ fileId: string; uploadUrl: string; method: 'PUT'; headers: Record<string, string> }>(
          'POST',
          '/v1/files/upload-url',
          body,
        ),
      finalize: (fileId: string) => this.req<unknown>('POST', '/v1/files/finalize', { fileId }),
      signedUrl: (fileId: string) =>
        this.req<FileSignedUrl>('GET', `/v1/files/${fileId}/signed-url`),
    },
    audit: (q: Record<string, string | number | undefined> = {}) =>
      this.req<{ items: unknown[] }>('GET', this.qs('/v1/admin/audit', q)),
    flags: {
      list: () => this.req<{ items: FeatureFlag[] }>('GET', '/v1/admin/flags'),
      set: (body: { key: string; enabled: boolean; rules?: unknown }) =>
        this.req<FeatureFlag>('POST', '/v1/admin/flags', body),
    },
  };

  // ===== Public website =====

  leads = {
    create: (
      body: {
        fullName: string;
        phone: string;
        email?: string;
        message: string;
        source?: string;
      },
      idempotencyKey?: string,
    ) =>
      this.req<{ id: string; createdAt: string }>('POST', '/v1/leads', body, {
        'Idempotency-Key': idempotencyKey ?? this.newIdempotencyKey(),
      }),
  };

  publicStats = {
    get: () => this.req<PublicStats>('GET', '/v1/public/stats'),
  };

  // ===== internals =====

  private async req<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    const url = `${this.opts.baseUrl}${path}`;
    const accessToken = (await this.opts.getAccessToken?.()) ?? null;
    const fetchImpl = this.opts.fetchImpl ?? fetch;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(extraHeaders ?? {}),
    };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    let res: Response;
    try {
      res = await fetchImpl(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      throw new NetworkError((err as Error).message ?? 'fetch failed', err);
    }

    if (res.status === 401 && accessToken) {
      const fresh = await this.refreshIfPossible();
      if (fresh) {
        headers.Authorization = `Bearer ${fresh}`;
        try {
          res = await fetchImpl(url, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
          });
        } catch (err) {
          throw new NetworkError((err as Error).message ?? 'fetch retry failed', err);
        }
      }
    }

    if (res.status === 204 || res.status === 202) {
      return undefined as T;
    }

    const text = await res.text();
    const parsed = text ? (JSON.parse(text) as unknown) : null;

    if (!res.ok) throw ApiError.fromResponse(res.status, parsed);
    return parsed as T;
  }

  private async refreshIfPossible(): Promise<string | null> {
    if (this.refreshing) return this.refreshing;
    const rt = await this.opts.getRefreshToken?.();
    if (!rt) return null;
    this.refreshing = (async () => {
      try {
        const auth = await this.auth.refresh(rt);
        this.opts.onTokenRefresh?.(auth.accessToken, auth.refreshToken);
        return auth.accessToken;
      } catch {
        return null;
      } finally {
        this.refreshing = undefined;
      }
    })();
    return this.refreshing;
  }

  private qs(path: string, q: Record<string, unknown>): string {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) {
      if (v === undefined || v === null || v === '') continue;
      params.set(k, String(v));
    }
    const s = params.toString();
    return s ? `${path}?${s}` : path;
  }

  private newIdempotencyKey(): string {
    if (this.opts.idempotencyKeyFactory) return this.opts.idempotencyKeyFactory();
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
    // Best-effort fallback for very old environments. Not RFC 4122-compliant but
    // distinguishable enough for backend idempotency caching.
    const t = Date.now().toString(16);
    const r = Math.random().toString(16).slice(2, 10);
    return `${t}-${r}-${r}`;
  }
}
