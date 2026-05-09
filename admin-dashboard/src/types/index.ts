export type OrderStatus =
  | 'submitted'
  | 'payment_pending'
  | 'payment_completed'
  | 'under_review'
  | 'processing'
  | 'worker_selected'
  | 'contract_in_progress'
  | 'arrival_in_progress'
  | 'completed'
  | 'cancelled';

export type VerificationStatus = 'verified' | 'pending' | 'not_verified' | 'failed';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  packageName: string;
  workerName: string | null;
  address: string;
  city: string;
  status: OrderStatus;
  totalAmount: number;
  placedAt: string;
  notes: string;
}

export interface Worker {
  id: string;
  nameAr: string;
  nationality: string;
  nationalityFlag: string;
  profession: string;
  experienceYears: number;
  age: number;
  monthlySalary: number;
  isAvailable: boolean;
  joinedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  city: string;
  totalOrders: number;
  verificationStatus: VerificationStatus;
  joinedAt: string;
}

export interface Payment {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  method: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  paidAt: string;
}

export interface ChartDataPoint {
  month: string;
  orders: number;
  revenue?: number;
}

export interface StatusChartData {
  status: string;
  count: number;
  color: string;
}

export interface NationalityChartData {
  nationality: string;
  count: number;
}
