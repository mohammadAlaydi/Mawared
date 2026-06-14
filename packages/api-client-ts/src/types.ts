import type { OrderStatus } from '@mawared/shared-types';

export type UserRole = 'CUSTOMER' | 'STAFF' | 'BRANCH_MANAGER' | 'SUPER_ADMIN';

export interface Paged<T> {
  items: T[];
  nextCursor: string | null;
}

export interface TokenBundle {
  tokenType: 'Bearer';
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInSec: number;
  refreshTokenExpiresInSec: number;
}

export interface AuthResponse extends TokenBundle {
  user: { id: string; role: UserRole; phoneE164?: string | null; email?: string | null };
}

// ===== Workers =====

export interface Worker {
  id: string;
  fullNameAr: string;
  fullNameEn?: string | null;
  profession: 'DOMESTIC_WORKER' | 'DRIVER' | 'CAREGIVER_ELDERLY' | 'CAREGIVER_CHILD';
  ageYears: number;
  experienceYears: number;
  bioAr: string;
  bioEn?: string | null;
  rating: string; // Decimal serialized
  reviewCount: number;
  monthlySalaryMinor: string; // BigInt serialized
  currency: string;
  availability: 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'ARCHIVED';
  nationality?: { code: string; nameAr: string; nameEn: string; flagEmoji: string };
  languages?: Array<{ language: { code: string; nameAr: string; nameEn: string }; proficiency: string }>;
  skills?: Array<{ skill: { slug: string; nameAr: string; nameEn: string } }>;
}

export interface SearchWorkersQuery {
  profession?: Worker['profession'];
  nationalityCode?: string;
  languageCode?: string;
  minSalaryMinor?: string | number | bigint;
  maxSalaryMinor?: string | number | bigint;
  minAge?: number;
  maxAge?: number;
  minExperienceYears?: number;
  branchId?: string;
  query?: string;
  sort?: 'price_asc' | 'price_desc' | 'rating_desc' | 'newest';
  cursor?: string;
  limit?: number;
}

// ===== Catalog =====

export interface ServiceCategory {
  id: string;
  slug: string;
  nameAr: string;
  nameEn?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  profession: Worker['profession'];
  displayOrder: number;
  isActive: boolean;
}

export interface ServicePackage {
  id: string;
  serviceId: string;
  nameAr: string;
  nameEn?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  type: 'HOURLY' | 'MONTHLY';
  durationValue: number;
  durationUnit: string;
  priceMinor: string;
  currency: string;
  vatRatePpm: number;
  isPopular: boolean;
  isActive: boolean;
}

// ===== Branches =====

export interface Branch {
  id: string;
  code: string;
  nameAr: string;
  nameEn?: string | null;
  city: string;
  district?: string | null;
  phoneE164: string;
  workingHoursAr: string;
  workingHoursEn?: string | null;
  latitude: string;
  longitude: string;
  photoUrl?: string | null;
}

// ===== Offers / promos =====

export interface Offer {
  id: string;
  code: string;
  titleAr: string;
  titleEn?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  discountPercent?: number | null;
  discountMinor?: string | null;
  currency: string;
  minOrderMinor: string;
  validFrom: string;
  validUntil: string;
}

export interface PromoValidation {
  promoId: string;
  discountMinor: string;
  currency: string;
}

// ===== Orders =====

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  workerId: string | null;
  packageId: string;
  addressId: string;
  branchId: string;
  status: OrderStatus;
  subtotalMinor: string;
  discountMinor: string;
  vatMinor: string;
  totalMinor: string;
  currency: string;
  placedAt: string | null;
  confirmedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  worker?: Pick<Worker, 'id' | 'fullNameAr' | 'fullNameEn' | 'profession'> | null;
  package?: Pick<ServicePackage, 'id' | 'nameAr' | 'nameEn' | 'type'>;
  statusHistory?: Array<{
    id: string;
    fromStatus: OrderStatus | null;
    toStatus: OrderStatus;
    actorType: 'SYSTEM' | 'CUSTOMER' | 'STAFF';
    note?: string | null;
    createdAt: string;
  }>;
}

export interface CreateOrderInput {
  workerId: string;
  packageId: string;
  addressId: string;
  promoCode?: string;
  notes?: string;
}

// ===== Payments =====

export interface PaymentIntentResponse {
  providerIntentId: string;
  clientSecret: string;
  amountMinor: string;
  currency: string;
}

// ===== Addresses =====

export interface Address {
  id: string;
  label: string;
  city: string;
  district: string;
  street: string;
  buildingNumber: string;
  additionalNotes?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  isDefault: boolean;
}

// ===== Notifications =====

export interface Notification {
  id: string;
  type: 'ORDER_UPDATE' | 'PAYMENT' | 'PROMOTION' | 'SYSTEM' | 'CONTRACT';
  titleAr: string;
  titleEn?: string | null;
  bodyAr: string;
  bodyEn?: string | null;
  channels: Array<'PUSH' | 'IN_APP' | 'EMAIL' | 'SMS'>;
  relatedOrderId?: string | null;
  data?: Record<string, string> | null;
  readAt?: string | null;
  createdAt: string;
}

// ===== Files =====

export interface FileSignedUrl {
  url: string;
  expiresAt: string;
  mimeType: string;
}

// ===== Customer contracts =====

export interface CustomerContract {
  id: string;
  contractNumber: string;
  status: 'ACTIVE' | 'EXPIRED' | 'VOIDED' | 'PENDING_RENEWAL';
  startDate: string;
  endDate: string;
  monthlySalaryMinor: string;
  currency: string;
  voidedAt: string | null;
  order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    totalMinor: string;
    currency: string;
    city: string | null;
  };
  worker: {
    id: string;
    fullNameAr: string;
    fullNameEn: string | null;
    profession: Worker['profession'];
    photoFileId: string | null;
    nationality: {
      code: string;
      nameAr: string;
      nameEn: string;
      flagEmoji: string;
    } | null;
  };
  pdfFileId: string | null;
  pdfReady: boolean;
}

// ===== Public marketing-site stats =====

export interface PublicStats {
  verifiedCustomerCount: number;
  availableWorkerCount: number;
  nationalityCount: number;
  averageWorkerRating: number;
  computedAt: string;
}

// ===== Admin notifications =====

export type AdminNotificationType =
  | 'LEAD'
  | 'ORDER_REVIEW'
  | 'ORDER_PAID'
  | 'CUSTOMER_NEW'
  | 'VERIFICATION_PENDING';

export interface AdminNotification {
  /** Stable across requests: `${type}:${entityId}`. Used for client read-state. */
  id: string;
  type: AdminNotificationType;
  titleAr: string;
  descriptionAr: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  /** Dashboard route to open on click, or null for purely informational items. */
  href: string | null;
  entityId: string;
  createdAt: string;
}

export interface AdminNotificationsResponse {
  items: AdminNotification[];
  generatedAt: string;
}

// ===== Admin reports =====

export interface AdminOverviewResponse {
  branchId: string | null;
  revenue: {
    yesterday: Array<{ currency: string; minor: string }>;
    dayBefore: Array<{ currency: string; minor: string }>;
    last30Days: Array<{ day: string; currency: string; minor: string }>;
  };
  ordersByStatus: Array<{ status: OrderStatus; count: number }>;
  workersByAvailability: Array<{
    availability: 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'ARCHIVED';
    count: number;
  }>;
  newCustomers30d: number;
  recentOrders: Array<{
    id: string;
    status: OrderStatus;
    currency: string;
    totalMinor: string;
    createdAt: string;
    customerName: string | null;
    customerPhone: string | null;
  }>;
}

export interface AdminRevenueReport {
  from: string;
  to: string;
  branchId: string | null;
  items: Array<{
    day: string;
    currency: string;
    grossMinor: string;
    netMinor: string;
    orderCount: number;
  }>;
}

export interface AdminOrdersByStatusReport {
  from: string;
  to: string;
  branchId: string | null;
  items: Array<{ status: OrderStatus; count: number }>;
}

export interface AdminRefundsReport {
  from: string;
  to: string;
  branchId: string | null;
  items: Array<{
    currency: string;
    refundCount: number;
    refundMinor: string;
    totalPaidOrders: number;
    refundRate: number;
  }>;
}

export interface AdminActiveWorkersResponse {
  branchId: string | null;
  total: number;
  byAvailability: Array<{
    availability: 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'ARCHIVED';
    count: number;
  }>;
  byNationality: Array<{
    nationalityId: string;
    code: string;
    nameAr: string;
    nameEn: string;
    flagEmoji: string;
    count: number;
  }>;
}

// ===== Admin payments / refunds =====

export interface AdminPaymentIntent {
  id: string;
  orderId: string;
  providerIntentId: string;
  status: string;
  amountMinor: string;
  currency: string;
  createdAt: string;
  paidAt: string | null;
}

export interface AdminRefund {
  id: string;
  paymentIntentId: string;
  orderId: string;
  status: string;
  amountMinor: string;
  currency: string;
  reason: string | null;
  createdAt: string;
}

// ===== Admin customer detail =====

export interface AdminCustomer {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  phoneE164: string;
  email: string | null;
  preferredLocale: 'ar' | 'en';
  verificationStatus: 'NOT_VERIFIED' | 'IN_PROGRESS' | 'VERIFIED' | 'FAILED';
  isSuspended: boolean;
  createdAt: string;
  totalOrders?: number;
  lifetimeValueMinor?: string;
}

/**
 * Returned by GET /v1/admin/customers/:id. Extends the list row with
 * address book + session count + computed lifetime value.
 */
export interface AdminCustomerDetail extends AdminCustomer {
  totalOrders: number;
  lifetimeValueMinor: string;
  activeSessions: number;
  addresses: Array<{
    id: string;
    label: string;
    city: string;
    district: string;
    street: string;
    buildingNumber: string;
    isDefault: boolean;
  }>;
}

// ===== Nationalities =====

export interface Nationality {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  flagEmoji: string;
}

// ===== Admin staff =====

export interface AdminStaff {
  id: string;
  email: string;
  fullName: string;
  role: 'STAFF' | 'BRANCH_MANAGER' | 'SUPER_ADMIN';
  branchId: string | null;
  isActive: boolean;
  totpEnrolled: boolean;
  createdAt: string;
}

// ===== Feature flags =====

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercent: number | null;
  userIds: string[] | null;
  roles: string[] | null;
  updatedAt: string;
}
