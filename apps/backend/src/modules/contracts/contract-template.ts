/**
 * Bilingual (Arabic RTL + English LTR) HTML template for contract PDFs.
 *
 * Designed for Puppeteer's `page.setContent` + `page.pdf({ format: 'A4' })`.
 * Uses Noto Sans Arabic via Google Fonts (with a print-safe fallback stack).
 * Layout: cover, parties, terms, signature lines. ~2 pages for a typical
 * 1-month contract.
 */

export interface ContractTemplateData {
  contractNumber: string;
  orderNumber: string;
  startDate: Date;
  endDate: Date;
  monthlySalaryMinor: bigint;
  currency: string;
  worker: { fullNameAr: string; fullNameEn?: string | null; profession: string; nationality: string };
  customer: { fullName: string; phone: string };
  branch: { nameAr: string; nameEn?: string | null; city: string; phoneE164: string };
}

const PROFESSION_LABELS: Record<string, { ar: string; en: string }> = {
  DOMESTIC_WORKER:   { ar: 'عاملة منزلية',  en: 'Domestic Worker' },
  DRIVER:            { ar: 'سائق',          en: 'Driver' },
  CAREGIVER_ELDERLY: { ar: 'رعاية كبار السن', en: 'Elder Caregiver' },
  CAREGIVER_CHILD:   { ar: 'رعاية الأطفال',  en: 'Child Caregiver' },
};

export function renderContractHtml(d: ContractTemplateData): string {
  const major = (Number(d.monthlySalaryMinor) / 100).toFixed(2);
  const prof = PROFESSION_LABELS[d.worker.profession] ?? { ar: d.worker.profession, en: d.worker.profession };
  const fmt = (date: Date) => date.toISOString().slice(0, 10);

  return /* html */ `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(d.contractNumber)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0; color: #111;
    font-family: 'Noto Sans Arabic', 'Inter', system-ui, sans-serif;
    font-size: 11pt; line-height: 1.55;
  }
  .en { font-family: 'Inter', system-ui, sans-serif; direction: ltr; text-align: left; }
  header { display: flex; justify-content: space-between; align-items: flex-start;
           border-bottom: 2px solid #0a3d62; padding-bottom: 10mm; margin-bottom: 8mm; }
  header .brand { font-size: 18pt; font-weight: 700; color: #0a3d62; }
  header .meta { text-align: left; direction: ltr; font-size: 9pt; color: #555; }
  h1 { font-size: 14pt; margin: 8mm 0 4mm; color: #0a3d62; }
  h2 { font-size: 12pt; margin: 6mm 0 2mm; color: #0a3d62; }
  table { width: 100%; border-collapse: collapse; margin: 3mm 0; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: right; vertical-align: top; }
  th { background: #f5f8fc; font-weight: 600; width: 35%; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
  ol { margin: 0; padding-right: 18px; }
  ol li { margin-bottom: 3mm; }
  .signatures { display: flex; justify-content: space-between; gap: 12mm; margin-top: 16mm; }
  .signatures .box { flex: 1; border-top: 1.5px solid #333; padding-top: 4mm; text-align: center; font-size: 10pt; }
  footer { position: fixed; bottom: 6mm; left: 16mm; right: 16mm;
           border-top: 1px solid #ddd; padding-top: 3mm; font-size: 8pt; color: #777;
           display: flex; justify-content: space-between; }
</style>
</head>
<body>
  <header>
    <div>
      <div class="brand">موارد الدولية</div>
      <div class="en" style="font-size:10pt;color:#555;">Mawared International</div>
    </div>
    <div class="meta">
      Contract&nbsp;#&nbsp;${escapeHtml(d.contractNumber)}<br>
      Order&nbsp;#&nbsp;${escapeHtml(d.orderNumber)}<br>
      ${fmt(new Date())}
    </div>
  </header>

  <h1>عقد توفير خدمات منزلية / Domestic Services Contract</h1>

  <h2>الأطراف / Parties</h2>
  <div class="grid">
    <table>
      <tr><th>الطرف الأول (المُستقدِم)</th><td>${escapeHtml(d.customer.fullName)}</td></tr>
      <tr><th>رقم الجوال</th><td class="en">${escapeHtml(d.customer.phone)}</td></tr>
      <tr><th>الفرع</th><td>${escapeHtml(d.branch.nameAr)} — ${escapeHtml(d.branch.city)}</td></tr>
    </table>
    <table>
      <tr><th>الطرف الثاني (العامل/ة)</th><td>${escapeHtml(d.worker.fullNameAr)}${d.worker.fullNameEn ? ` <span class="en">(${escapeHtml(d.worker.fullNameEn)})</span>` : ''}</td></tr>
      <tr><th>الجنسية</th><td>${escapeHtml(d.worker.nationality)}</td></tr>
      <tr><th>المهنة</th><td>${escapeHtml(prof.ar)} <span class="en">(${escapeHtml(prof.en)})</span></td></tr>
    </table>
  </div>

  <h2>تفاصيل العقد / Contract Terms</h2>
  <table>
    <tr><th>تاريخ بدء الخدمة / Start date</th><td class="en">${fmt(d.startDate)}</td></tr>
    <tr><th>تاريخ نهاية الخدمة / End date</th><td class="en">${fmt(d.endDate)}</td></tr>
    <tr><th>الراتب الشهري / Monthly salary</th><td class="en">${major} ${escapeHtml(d.currency)}</td></tr>
  </table>

  <h2>البنود العامة / General Provisions</h2>
  <ol>
    <li>يلتزم الطرف الثاني بأداء الخدمات المنزلية المتفق عليها بكفاءة وأمانة طوال مدة العقد.</li>
    <li>يلتزم الطرف الأول بدفع الراتب الشهري بانتظام وتوفير سكن لائق وثلاث وجبات يومياً.</li>
    <li>يحق لأي من الطرفين إنهاء العقد بإشعار خطي مدته ١٤ يوماً وفقاً للأنظمة المعمول بها.</li>
    <li>أي خلاف ينشأ عن هذا العقد يُحال إلى الجهة المختصة في المملكة العربية السعودية.</li>
    <li>The contract is governed by the labour laws of the Kingdom of Saudi Arabia.</li>
  </ol>

  <div class="signatures">
    <div class="box">توقيع الطرف الأول<br>Customer Signature</div>
    <div class="box">توقيع الطرف الثاني<br>Worker Signature</div>
    <div class="box">ختم موارد الدولية<br>Mawared International Seal</div>
  </div>

  <footer>
    <span>${escapeHtml(d.branch.nameAr)} • ${escapeHtml(d.branch.phoneE164)}</span>
    <span class="en">Contract ${escapeHtml(d.contractNumber)}</span>
  </footer>
</body>
</html>`;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
