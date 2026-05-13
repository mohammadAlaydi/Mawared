import type { Worker } from '@mawared/api-client';

/**
 * Display helpers for backend Worker enums. Arabic labels + color classes
 * for chips. Keep in sync with the backend's WorkerProfession + WorkerAvailability
 * enums (apps/backend/prisma/schema.prisma).
 */

export const PROFESSION_LABELS: Record<Worker['profession'], string> = {
  DOMESTIC_WORKER: 'عاملة منزلية',
  DRIVER: 'سائق خاص',
  CAREGIVER_ELDERLY: 'رعاية مسنين',
  CAREGIVER_CHILD: 'مربية أطفال',
};

export const PROFESSION_COLORS: Record<Worker['profession'], string> = {
  DOMESTIC_WORKER: 'bg-blue-100 text-blue-700 border-blue-200',
  DRIVER: 'bg-purple-100 text-purple-700 border-purple-200',
  CAREGIVER_ELDERLY: 'bg-amber-100 text-amber-700 border-amber-200',
  CAREGIVER_CHILD: 'bg-pink-100 text-pink-700 border-pink-200',
};

export const AVAILABILITY_LABELS: Record<Worker['availability'], string> = {
  AVAILABLE: 'متاح',
  RESERVED: 'محجوز',
  BOOKED: 'متعاقد',
  ARCHIVED: 'مؤرشف',
};

export const AVAILABILITY_COLORS: Record<Worker['availability'], string> = {
  AVAILABLE: 'bg-green-100 text-green-700',
  RESERVED: 'bg-amber-100 text-amber-700',
  BOOKED: 'bg-indigo-100 text-indigo-700',
  ARCHIVED: 'bg-gray-100 text-gray-500',
};

export const PROFESSIONS = [
  'DOMESTIC_WORKER',
  'DRIVER',
  'CAREGIVER_ELDERLY',
  'CAREGIVER_CHILD',
] as const satisfies readonly Worker['profession'][];

export const AVAILABILITIES = [
  'AVAILABLE',
  'RESERVED',
  'BOOKED',
  'ARCHIVED',
] as const satisfies readonly Worker['availability'][];
