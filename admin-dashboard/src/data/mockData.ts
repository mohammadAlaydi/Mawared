import { Order, Worker, Customer, Payment, Service, Package } from '@/types';

export const mockServices: Service[] = [
  { id: '1', name: 'عاملة منزلية', description: 'تنظيف، طبخ، كي، وترتيب المنزل', iconName: 'Home', active: true },
  { id: '2', name: 'سائق خاص', description: 'قيادة احترافية وتوصيل يومي', iconName: 'Car', active: true },
  { id: '3', name: 'مربية أطفال', description: 'رعاية شاملة وتعليم مبكر للأطفال', iconName: 'Baby', active: true },
  { id: '4', name: 'رعاية مسنين', description: 'مرافقة ورعاية صحية لكبار السن', iconName: 'Heart', active: true },
];

export const mockPackages: Package[] = [
  { id: '1', name: 'زيارة أساسية', description: '٤ ساعات تنظيف', duration: '٤ ساعات', price: 150, type: 'hourly', active: true },
  { id: '2', name: 'زيارة مميزة', description: '٨ ساعات تنظيف + كي', duration: '٨ ساعات', price: 280, type: 'hourly', active: true },
  { id: '3', name: 'زيارة VIP', description: 'يوم كامل — كل الخدمات', duration: '١٢ ساعة', price: 400, type: 'hourly', active: true },
  { id: '4', name: 'الباقة الأساسية', description: 'عاملة منزلية واحدة', duration: 'شهري', price: 1500, type: 'monthly', active: true },
  { id: '5', name: 'الباقة المميزة', description: 'عاملة مدربة + خدمات شاملة', duration: 'شهري', price: 2800, type: 'monthly', active: true },
  { id: '6', name: 'الباقة الذهبية', description: 'عاملة + سائق', duration: 'شهري', price: 4500, type: 'monthly', active: true },
];

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

function makeWorker(
  id: string, nameAr: string, nationality: string, flag: string, professions: string[],
  exp: number, age: number, salary: number, available: boolean, joined: string,
  religion: string, marital: string, languages: string[], height: number, weight: number, bio: string,
): Worker {
  return {
    id, nameAr, nationality, nationalityFlag: flag, professions, experienceYears: exp,
    age, monthlySalary: salary, isAvailable: available, joinedAt: joined,
    photoUrl: `/workers/photo-${id}.png`, cvImageUrl: `/workers/doc-cv.png`, bio,
    religion, maritalStatus: marital, languages, height, weight,
    documents: [
      { id: `${id}-pass`, type: 'passport', label: 'جواز السفر', imageUrl: `/workers/doc-passport.png`, uploadedAt: joined, verified: true },
      { id: `${id}-iqama`, type: 'iqama', label: 'الإقامة', imageUrl: `/workers/doc-iqama.png`, uploadedAt: joined, verified: true },
      { id: `${id}-med`, type: 'medical', label: 'التقرير الطبي', imageUrl: `/workers/doc-medical.png`, uploadedAt: joined, verified: id !== '3' },
    ],
    workHistory: [
      { id: `${id}-h1`, customerName: 'عميل سابق', serviceName: professions[0], startDate: '2023-01-01', endDate: '2023-12-31', rating: 4 + (parseInt(id) % 2), notes: 'أداء ممتاز' },
    ],
  };
}

export const mockWorkers: Worker[] = [
  makeWorker('1', 'ماريا سانتوس', 'فلبينية', '🇵🇭', ['عاملة منزلية', 'مربية أطفال'], 5, 32, 1800, false, '2024-01-15', 'مسيحية', 'عزباء', ['إنجليزي', 'تاغالوغ'], 158, 55, 'عاملة متعددة المهارات في التنظيف ورعاية الأطفال'),
  makeWorker('2', 'روزا ديلا كروز', 'فلبينية', '🇵🇭', ['مربية أطفال'], 7, 35, 2200, false, '2024-02-01', 'مسيحية', 'متزوجة', ['إنجليزي', 'تاغالوغ'], 160, 58, 'متخصصة في رعاية الرضع والأطفال'),
  makeWorker('3', 'سيتي نور', 'إندونيسية', '🇮🇩', ['عاملة منزلية'], 3, 28, 1500, true, '2024-03-10', 'مسلمة', 'عزباء', ['إندونيسي', 'عربي بسيط'], 155, 50, 'خبرة في التنظيف والطبخ'),
  makeWorker('4', 'أمينة حسن', 'إثيوبية', '🇪🇹', ['رعاية مسنين', 'عاملة منزلية'], 4, 30, 1600, false, '2024-01-20', 'مسلمة', 'عزباء', ['أمهري', 'عربي'], 162, 56, 'متخصصة في رعاية كبار السن مع خبرة منزلية'),
  makeWorker('5', 'راجيش كومار', 'هندية', '🇮🇳', ['سائق خاص'], 8, 38, 2000, false, '2024-04-05', 'هندوسي', 'متزوج', ['هندي', 'إنجليزي', 'عربي بسيط'], 175, 72, 'سائق محترف برخصة دولية'),
  makeWorker('6', 'جوسلين مارتينيز', 'فلبينية', '🇵🇭', ['عاملة منزلية'], 6, 34, 2000, false, '2024-02-15', 'مسيحية', 'متزوجة', ['إنجليزي', 'تاغالوغ'], 157, 54, 'خبرة في المنازل الكبيرة والفلل'),
  makeWorker('7', 'فاطمة عبدي', 'إثيوبية', '🇪🇹', ['رعاية مسنين'], 5, 31, 1700, false, '2024-03-01', 'مسلمة', 'عزباء', ['أمهري', 'عربي'], 164, 57, 'صبورة ومتفانية في رعاية المسنين'),
  makeWorker('8', 'ديوي سوسانتي', 'إندونيسية', '🇮🇩', ['عاملة منزلية', 'مربية أطفال'], 4, 29, 1500, true, '2024-05-10', 'مسلمة', 'عزباء', ['إندونيسي', 'عربي بسيط'], 153, 48, 'تجيد الطبخ والتنظيف ورعاية الأطفال'),
  makeWorker('9', 'آنا ريس', 'فلبينية', '🇵🇭', ['عاملة منزلية'], 3, 27, 1600, false, '2024-04-20', 'مسيحية', 'عزباء', ['إنجليزي', 'تاغالوغ'], 156, 52, 'نشيطة ودقيقة في العمل'),
  makeWorker('10', 'سونيتا رام', 'هندية', '🇮🇳', ['مربية أطفال', 'رعاية مسنين'], 6, 33, 1900, true, '2024-06-01', 'هندوسية', 'متزوجة', ['هندي', 'إنجليزي'], 159, 55, 'خبرة في رعاية الأطفال وكبار السن'),
  makeWorker('11', 'ليزا فرنانديز', 'فلبينية', '🇵🇭', ['عاملة منزلية'], 2, 25, 1400, true, '2024-06-15', 'مسيحية', 'عزباء', ['إنجليزي', 'تاغالوغ'], 154, 49, 'حديثة الخبرة ومتحمسة للعمل'),
  makeWorker('12', 'هالوما عدن', 'إثيوبية', '🇪🇹', ['عاملة منزلية'], 3, 26, 1400, true, '2024-05-20', 'مسلمة', 'عزباء', ['أمهري', 'عربي بسيط'], 160, 53, 'تجيد الطبخ العربي والتنظيف'),
  makeWorker('13', 'أحمد حسين', 'هندية', '🇮🇳', ['سائق خاص'], 10, 42, 2200, false, '2024-01-10', 'مسلم', 'متزوج', ['هندي', 'عربي', 'إنجليزي'], 178, 75, 'سائق ذو خبرة طويلة في المملكة'),
  makeWorker('14', 'كارمن لوبيز', 'فلبينية', '🇵🇭', ['عاملة منزلية', 'مربية أطفال', 'رعاية مسنين'], 4, 30, 1700, false, '2024-07-01', 'مسيحية', 'عزباء', ['إنجليزي', 'تاغالوغ', 'عربي بسيط'], 155, 51, 'متعددة المهارات — تنظيف ورعاية أطفال ومسنين'),
  makeWorker('15', 'ويويك ساري', 'إندونيسية', '🇮🇩', ['مربية أطفال', 'عاملة منزلية'], 5, 31, 1600, true, '2024-06-20', 'مسلمة', 'متزوجة', ['إندونيسي', 'عربي'], 156, 50, 'خبرة في رعاية الأطفال والأعمال المنزلية'),
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
