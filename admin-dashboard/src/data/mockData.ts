import { Order, Worker, Customer, Payment } from '@/types';

export const mockOrders: Order[] = [
  { id: '1', orderNumber: 'MD-2024-00101', customerName: 'أحمد العتيبي', customerPhone: '0551234567', serviceType: 'عاملة منزلية', packageName: 'الباقة المميزة', workerName: 'ماريا سانتوس', address: 'حي النرجس', city: 'الرياض', status: 'completed', totalAmount: 2800, placedAt: '2024-07-01', notes: '' },
  { id: '2', orderNumber: 'MD-2024-00102', customerName: 'سارة الشمري', customerPhone: '0559876543', serviceType: 'مربية أطفال', packageName: 'الباقة الذهبية', workerName: 'روزا ديلا كروز', address: 'حي الملقا', city: 'الرياض', status: 'processing', totalAmount: 4500, placedAt: '2024-07-03', notes: 'تحتاج خبرة مع الرضع' },
  { id: '3', orderNumber: 'MD-2024-00103', customerName: 'خالد القحطاني', customerPhone: '0501112233', serviceType: 'سائق خاص', packageName: 'الباقة الأساسية', workerName: null, address: 'حي الحمراء', city: 'جدة', status: 'submitted', totalAmount: 1500, placedAt: '2024-07-05', notes: '' },
  { id: '4', orderNumber: 'MD-2024-00104', customerName: 'نورة الحربي', customerPhone: '0567778899', serviceType: 'رعاية مسنين', packageName: 'الباقة المميزة', workerName: 'أمينة حسن', address: 'حي الروضة', city: 'الدمام', status: 'payment_pending', totalAmount: 2800, placedAt: '2024-07-06', notes: '' },
  { id: '5', orderNumber: 'MD-2024-00105', customerName: 'فهد المالكي', customerPhone: '0543334455', serviceType: 'عاملة منزلية', packageName: 'الباقة الذهبية', workerName: 'جوسلين مارتينيز', address: 'حي العليا', city: 'الرياض', status: 'completed', totalAmount: 4500, placedAt: '2024-07-08', notes: '' },
  { id: '6', orderNumber: 'MD-2024-00106', customerName: 'منى السبيعي', customerPhone: '0522223344', serviceType: 'عاملة منزلية', packageName: 'الباقة الأساسية', workerName: null, address: 'حي الصفا', city: 'جدة', status: 'under_review', totalAmount: 1500, placedAt: '2024-07-09', notes: '' },
  { id: '7', orderNumber: 'MD-2024-00107', customerName: 'عبدالله الدوسري', customerPhone: '0534445566', serviceType: 'سائق خاص', packageName: 'الباقة المميزة', workerName: 'راجيش كومار', address: 'حي الياسمين', city: 'الرياض', status: 'worker_selected', totalAmount: 2800, placedAt: '2024-07-10', notes: '' },
  { id: '8', orderNumber: 'MD-2024-00108', customerName: 'هند العنزي', customerPhone: '0511112233', serviceType: 'مربية أطفال', packageName: 'الباقة الأساسية', workerName: null, address: 'حي الشاطئ', city: 'الدمام', status: 'cancelled', totalAmount: 1500, placedAt: '2024-07-11', notes: 'تم الإلغاء بطلب العميل' },
  { id: '9', orderNumber: 'MD-2024-00109', customerName: 'محمد الغامدي', customerPhone: '0556667788', serviceType: 'عاملة منزلية', packageName: 'الباقة المميزة', workerName: 'آنا ريس', address: 'حي السلامة', city: 'جدة', status: 'contract_in_progress', totalAmount: 2800, placedAt: '2024-07-12', notes: '' },
  { id: '10', orderNumber: 'MD-2024-00110', customerName: 'ريم الزهراني', customerPhone: '0578889900', serviceType: 'رعاية مسنين', packageName: 'الباقة الذهبية', workerName: 'فاطمة عبدي', address: 'حي المروج', city: 'الرياض', status: 'arrival_in_progress', totalAmount: 4500, placedAt: '2024-07-13', notes: '' },
  { id: '11', orderNumber: 'MD-2024-00111', customerName: 'سعود العمري', customerPhone: '0599001122', serviceType: 'عاملة منزلية', packageName: 'الباقة الأساسية', workerName: 'ليزا فرنانديز', address: 'حي الورود', city: 'الرياض', status: 'completed', totalAmount: 1500, placedAt: '2024-06-15', notes: '' },
  { id: '12', orderNumber: 'MD-2024-00112', customerName: 'لمياء البلوي', customerPhone: '0512345678', serviceType: 'سائق خاص', packageName: 'الباقة المميزة', workerName: 'أحمد حسين', address: 'حي النزهة', city: 'جدة', status: 'completed', totalAmount: 2800, placedAt: '2024-06-20', notes: '' },
  { id: '13', orderNumber: 'MD-2024-00113', customerName: 'عمر الشهري', customerPhone: '0533456789', serviceType: 'عاملة منزلية', packageName: 'الباقة الذهبية', workerName: 'كارمن لوبيز', address: 'حي الربوة', city: 'الرياض', status: 'payment_completed', totalAmount: 4500, placedAt: '2024-07-14', notes: '' },
  { id: '14', orderNumber: 'MD-2024-00114', customerName: 'عائشة المطيري', customerPhone: '0544567890', serviceType: 'مربية أطفال', packageName: 'الباقة المميزة', workerName: null, address: 'حي الخالدية', city: 'الدمام', status: 'processing', totalAmount: 2800, placedAt: '2024-07-15', notes: '' },
  { id: '15', orderNumber: 'MD-2024-00115', customerName: 'تركي الرشيدي', customerPhone: '0555678901', serviceType: 'عاملة منزلية', packageName: 'الباقة الأساسية', workerName: 'جيني كروز', address: 'حي الملك فهد', city: 'الرياض', status: 'completed', totalAmount: 1500, placedAt: '2024-06-10', notes: '' },
];

export const mockWorkers: Worker[] = [
  { id: '1', nameAr: 'ماريا سانتوس', nationality: 'فلبينية', nationalityFlag: '🇵🇭', profession: 'عاملة منزلية', experienceYears: 5, age: 32, monthlySalary: 1800, isAvailable: false, joinedAt: '2024-01-15' },
  { id: '2', nameAr: 'روزا ديلا كروز', nationality: 'فلبينية', nationalityFlag: '🇵🇭', profession: 'مربية أطفال', experienceYears: 7, age: 35, monthlySalary: 2200, isAvailable: false, joinedAt: '2024-02-01' },
  { id: '3', nameAr: 'سيتي نور', nationality: 'إندونيسية', nationalityFlag: '🇮🇩', profession: 'عاملة منزلية', experienceYears: 3, age: 28, monthlySalary: 1500, isAvailable: true, joinedAt: '2024-03-10' },
  { id: '4', nameAr: 'أمينة حسن', nationality: 'إثيوبية', nationalityFlag: '🇪🇹', profession: 'رعاية مسنين', experienceYears: 4, age: 30, monthlySalary: 1600, isAvailable: false, joinedAt: '2024-01-20' },
  { id: '5', nameAr: 'راجيش كومار', nationality: 'هندية', nationalityFlag: '🇮🇳', profession: 'سائق خاص', experienceYears: 8, age: 38, monthlySalary: 2000, isAvailable: false, joinedAt: '2024-04-05' },
  { id: '6', nameAr: 'جوسلين مارتينيز', nationality: 'فلبينية', nationalityFlag: '🇵🇭', profession: 'عاملة منزلية', experienceYears: 6, age: 34, monthlySalary: 2000, isAvailable: false, joinedAt: '2024-02-15' },
  { id: '7', nameAr: 'فاطمة عبدي', nationality: 'إثيوبية', nationalityFlag: '🇪🇹', profession: 'رعاية مسنين', experienceYears: 5, age: 31, monthlySalary: 1700, isAvailable: false, joinedAt: '2024-03-01' },
  { id: '8', nameAr: 'ديوي سوسانتي', nationality: 'إندونيسية', nationalityFlag: '🇮🇩', profession: 'عاملة منزلية', experienceYears: 4, age: 29, monthlySalary: 1500, isAvailable: true, joinedAt: '2024-05-10' },
  { id: '9', nameAr: 'آنا ريس', nationality: 'فلبينية', nationalityFlag: '🇵🇭', profession: 'عاملة منزلية', experienceYears: 3, age: 27, monthlySalary: 1600, isAvailable: false, joinedAt: '2024-04-20' },
  { id: '10', nameAr: 'سونيتا رام', nationality: 'هندية', nationalityFlag: '🇮🇳', profession: 'مربية أطفال', experienceYears: 6, age: 33, monthlySalary: 1900, isAvailable: true, joinedAt: '2024-06-01' },
  { id: '11', nameAr: 'ليزا فرنانديز', nationality: 'فلبينية', nationalityFlag: '🇵🇭', profession: 'عاملة منزلية', experienceYears: 2, age: 25, monthlySalary: 1400, isAvailable: true, joinedAt: '2024-06-15' },
  { id: '12', nameAr: 'هالوما عدن', nationality: 'إثيوبية', nationalityFlag: '🇪🇹', profession: 'عاملة منزلية', experienceYears: 3, age: 26, monthlySalary: 1400, isAvailable: true, joinedAt: '2024-05-20' },
  { id: '13', nameAr: 'أحمد حسين', nationality: 'هندية', nationalityFlag: '🇮🇳', profession: 'سائق خاص', experienceYears: 10, age: 42, monthlySalary: 2200, isAvailable: false, joinedAt: '2024-01-10' },
  { id: '14', nameAr: 'كارمن لوبيز', nationality: 'فلبينية', nationalityFlag: '🇵🇭', profession: 'عاملة منزلية', experienceYears: 4, age: 30, monthlySalary: 1700, isAvailable: false, joinedAt: '2024-07-01' },
  { id: '15', nameAr: 'ويويك ساري', nationality: 'إندونيسية', nationalityFlag: '🇮🇩', profession: 'مربية أطفال', experienceYears: 5, age: 31, monthlySalary: 1600, isAvailable: true, joinedAt: '2024-06-20' },
];

export const mockCustomers: Customer[] = [
  { id: '1', name: 'أحمد العتيبي', phone: '0551234567', city: 'الرياض', totalOrders: 3, verificationStatus: 'verified', joinedAt: '2024-01-10' },
  { id: '2', name: 'سارة الشمري', phone: '0559876543', city: 'الرياض', totalOrders: 2, verificationStatus: 'verified', joinedAt: '2024-02-15' },
  { id: '3', name: 'خالد القحطاني', phone: '0501112233', city: 'جدة', totalOrders: 1, verificationStatus: 'pending', joinedAt: '2024-07-01' },
  { id: '4', name: 'نورة الحربي', phone: '0567778899', city: 'الدمام', totalOrders: 1, verificationStatus: 'verified', joinedAt: '2024-03-20' },
  { id: '5', name: 'فهد المالكي', phone: '0543334455', city: 'الرياض', totalOrders: 4, verificationStatus: 'verified', joinedAt: '2024-01-05' },
  { id: '6', name: 'منى السبيعي', phone: '0522223344', city: 'جدة', totalOrders: 1, verificationStatus: 'not_verified', joinedAt: '2024-07-05' },
  { id: '7', name: 'عبدالله الدوسري', phone: '0534445566', city: 'الرياض', totalOrders: 2, verificationStatus: 'verified', joinedAt: '2024-04-10' },
  { id: '8', name: 'هند العنزي', phone: '0511112233', city: 'الدمام', totalOrders: 1, verificationStatus: 'failed', joinedAt: '2024-06-20' },
  { id: '9', name: 'محمد الغامدي', phone: '0556667788', city: 'جدة', totalOrders: 2, verificationStatus: 'verified', joinedAt: '2024-05-15' },
  { id: '10', name: 'ريم الزهراني', phone: '0578889900', city: 'الرياض', totalOrders: 1, verificationStatus: 'pending', joinedAt: '2024-07-10' },
];

export const mockPayments: Payment[] = [
  { id: '1', orderNumber: 'MD-2024-00101', customerName: 'أحمد العتيبي', amount: 2800, method: 'مدى', status: 'completed', paidAt: '2024-07-01' },
  { id: '2', orderNumber: 'MD-2024-00102', customerName: 'سارة الشمري', amount: 4500, method: 'فيزا', status: 'completed', paidAt: '2024-07-03' },
  { id: '3', orderNumber: 'MD-2024-00104', customerName: 'نورة الحربي', amount: 2800, method: 'تابي', status: 'pending', paidAt: '2024-07-06' },
  { id: '4', orderNumber: 'MD-2024-00105', customerName: 'فهد المالكي', amount: 4500, method: 'مدى', status: 'completed', paidAt: '2024-07-08' },
  { id: '5', orderNumber: 'MD-2024-00108', customerName: 'هند العنزي', amount: 1500, method: 'فيزا', status: 'refunded', paidAt: '2024-07-11' },
  { id: '6', orderNumber: 'MD-2024-00109', customerName: 'محمد الغامدي', amount: 2800, method: 'مدى', status: 'completed', paidAt: '2024-07-12' },
  { id: '7', orderNumber: 'MD-2024-00110', customerName: 'ريم الزهراني', amount: 4500, method: 'فيزا', status: 'completed', paidAt: '2024-07-13' },
  { id: '8', orderNumber: 'MD-2024-00111', customerName: 'سعود العمري', amount: 1500, method: 'مدى', status: 'completed', paidAt: '2024-06-15' },
  { id: '9', orderNumber: 'MD-2024-00113', customerName: 'عمر الشهري', amount: 4500, method: 'تابي', status: 'completed', paidAt: '2024-07-14' },
  { id: '10', orderNumber: 'MD-2024-00115', customerName: 'تركي الرشيدي', amount: 1500, method: 'مدى', status: 'completed', paidAt: '2024-06-10' },
];

export const ordersOverTime = [
  { month: 'يناير', orders: 24 },
  { month: 'فبراير', orders: 31 },
  { month: 'مارس', orders: 28 },
  { month: 'أبريل', orders: 45 },
  { month: 'مايو', orders: 52 },
  { month: 'يونيو', orders: 48 },
  { month: 'يوليو', orders: 61 },
];

export const ordersByStatus = [
  { status: 'مكتمل', count: 142, color: '#2E7D32' },
  { status: 'جاري', count: 38, color: '#E65100' },
  { status: 'قيد المراجعة', count: 21, color: '#1565C0' },
  { status: 'ملغى', count: 12, color: '#C62828' },
];

export const workersByNationality = [
  { nationality: 'فلبينية', count: 8 },
  { nationality: 'إندونيسية', count: 5 },
  { nationality: 'إثيوبية', count: 4 },
  { nationality: 'هندية', count: 3 },
];

export const revenueByMonth = ordersOverTime.map(o => ({ ...o, revenue: o.orders * 1400 }));
