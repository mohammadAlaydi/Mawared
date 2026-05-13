/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

/**
 * Idempotent dev seed.
 *
 * Creates the minimum data needed for local development:
 *   - a single Mawared branch
 *   - a SUPER_ADMIN staff account
 *   - reference lookups: nationalities, languages, skills
 *   - one ServiceCategory + one ServicePackage
 *   - two Workers (one AVAILABLE, one BOOKED)
 *
 * Re-running the seed is safe (uses upserts on stable natural keys).
 */
const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('[seed] starting');

  const branch = await prisma.branch.upsert({
    where: { code: 'RUH-01' },
    update: {},
    create: {
      code: 'RUH-01',
      nameAr: 'فرع الرياض الرئيسي',
      nameEn: 'Riyadh Main Branch',
      city: 'Riyadh',
      district: 'Olaya',
      phoneE164: '+966112345678',
      workingHoursAr: '8:00ص - 11:00م',
      workingHoursEn: '8am - 11pm',
      latitude: 24.7136,
      longitude: 46.6753,
      isActive: true,
    },
  });
  console.log('[seed] branch upserted:', branch.code);

  // Dev super-admin. Password is "ChangeMe!2026" — change in production.
  const adminPasswordHash = await argon2.hash('ChangeMe!2026', { type: argon2.argon2id });
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mawared.local' },
    update: {
      isActive: true,
      role: 'SUPER_ADMIN',
      branchId: branch.id,
      passwordHash: adminPasswordHash,
    },
    create: {
      email: 'admin@mawared.local',
      role: 'SUPER_ADMIN',
      isActive: true,
      branchId: branch.id,
      passwordHash: adminPasswordHash,
      staffProfile: {
        create: { firstName: 'Super', lastName: 'Admin', title: 'Owner' },
      },
    },
  });
  console.log('[seed] super-admin upserted:', admin.email, '(password: ChangeMe!2026)');

  const nationalities = [
    { code: 'PH', nameAr: 'الفلبين', nameEn: 'Philippines', flagEmoji: '🇵🇭' },
    { code: 'ET', nameAr: 'إثيوبيا', nameEn: 'Ethiopia', flagEmoji: '🇪🇹' },
    { code: 'KE', nameAr: 'كينيا', nameEn: 'Kenya', flagEmoji: '🇰🇪' },
    { code: 'BD', nameAr: 'بنغلاديش', nameEn: 'Bangladesh', flagEmoji: '🇧🇩' },
  ];
  for (const n of nationalities) {
    await prisma.nationality.upsert({ where: { code: n.code }, update: {}, create: n });
  }
  console.log('[seed] nationalities upserted:', nationalities.length);

  const languages = [
    { code: 'ar', nameAr: 'العربية', nameEn: 'Arabic' },
    { code: 'en', nameAr: 'الإنجليزية', nameEn: 'English' },
    { code: 'tl', nameAr: 'الفلبينية', nameEn: 'Tagalog' },
    { code: 'ur', nameAr: 'الأوردية', nameEn: 'Urdu' },
  ];
  for (const l of languages) {
    await prisma.language.upsert({ where: { code: l.code }, update: {}, create: l });
  }

  const skills = [
    { slug: 'cooking', nameAr: 'الطبخ', nameEn: 'Cooking' },
    { slug: 'cleaning', nameAr: 'التنظيف', nameEn: 'Cleaning' },
    { slug: 'ironing', nameAr: 'الكي', nameEn: 'Ironing' },
    { slug: 'child_care', nameAr: 'رعاية الأطفال', nameEn: 'Child care' },
    { slug: 'elder_care', nameAr: 'رعاية كبار السن', nameEn: 'Elder care' },
  ];
  for (const s of skills) {
    await prisma.skill.upsert({ where: { slug: s.slug }, update: {}, create: s });
  }

  const service = await prisma.serviceCategory.upsert({
    where: { slug: 'domestic-monthly' },
    update: {},
    create: {
      slug: 'domestic-monthly',
      nameAr: 'عاملة منزلية - شهري',
      nameEn: 'Domestic Worker — Monthly',
      profession: 'DOMESTIC_WORKER',
      isActive: true,
      displayOrder: 1,
    },
  });

  const existingPackage = await prisma.servicePackage.findFirst({
    where: { serviceId: service.id, type: 'MONTHLY' },
  });
  const pkg =
    existingPackage ??
    (await prisma.servicePackage.create({
      data: {
        serviceId: service.id,
        nameAr: 'الباقة الشهرية الأساسية',
        nameEn: 'Standard Monthly',
        type: 'MONTHLY',
        durationValue: 1,
        durationUnit: 'MONTH',
        priceMinor: 200_000n, // 2,000 SAR
        currency: 'SAR',
        isActive: true,
        isPopular: true,
      },
    }));
  console.log('[seed] service package:', pkg.nameEn);

  const ph = await prisma.nationality.findUniqueOrThrow({ where: { code: 'PH' } });
  const et = await prisma.nationality.findUniqueOrThrow({ where: { code: 'ET' } });

  await prisma.worker.upsert({
    where: { id: '00000000-0000-0000-0000-000000000101' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000101',
      branchId: branch.id,
      nationalityId: ph.id,
      fullNameAr: 'ماريا سانتوس',
      fullNameEn: 'Maria Santos',
      profession: 'DOMESTIC_WORKER',
      ageYears: 32,
      experienceYears: 7,
      bioAr: 'عاملة منزلية ذات خبرة في الطبخ والتنظيف ورعاية الأطفال.',
      bioEn: 'Experienced domestic worker — cooking, cleaning, child care.',
      monthlySalaryMinor: 150_000n,
      currency: 'SAR',
      availability: 'AVAILABLE',
      rating: 4.7,
      reviewCount: 12,
    },
  });

  await prisma.worker.upsert({
    where: { id: '00000000-0000-0000-0000-000000000102' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000102',
      branchId: branch.id,
      nationalityId: et.id,
      fullNameAr: 'مارتا بيكيلي',
      fullNameEn: 'Marta Bekele',
      profession: 'CAREGIVER_ELDERLY',
      ageYears: 38,
      experienceYears: 10,
      bioAr: 'مقدمة رعاية لكبار السن مع خبرة في الإسعافات الأولية.',
      bioEn: 'Elder caregiver with first-aid certification.',
      monthlySalaryMinor: 180_000n,
      currency: 'SAR',
      availability: 'BOOKED',
      rating: 4.9,
      reviewCount: 5,
    },
  });
  console.log('[seed] workers upserted');

  console.log('[seed] done');
}

main()
  .catch((err) => {
    console.error('[seed] failed', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
