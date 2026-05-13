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
