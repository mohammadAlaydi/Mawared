import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { renderContractHtml, type ContractTemplateData } from './contract-template';
import type { Env } from '@/shared/config/env.schema';

/**
 * Renders the contract template to PDF via Puppeteer and uploads to R2/S3.
 *
 * `puppeteer` is loaded with a dynamic import so the API process boots
 * without Chromium present. If the import fails (or S3 isn't configured),
 * generation logs a warning and leaves the Contract.pdfFileId NULL —
 * the customer-facing endpoint already handles that gracefully.
 *
 * In production we recommend running the worker container with `puppeteer`
 * preinstalled (apt: ca-certificates fonts-liberation libnss3 libxss1 etc.)
 * and the worker process spawning a single shared browser instance.
 */
@Injectable()
export class ContractPdfService implements OnModuleDestroy {
  private readonly logger = new Logger(ContractPdfService.name);
  private browserPromise?: Promise<unknown>;
  private s3?: S3Client;
  private bucket?: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {
    const endpoint = config.get('S3_ENDPOINT', { infer: true });
    const region = config.get('S3_REGION', { infer: true });
    const accessKeyId = config.get('S3_ACCESS_KEY_ID', { infer: true });
    const secretAccessKey = config.get('S3_SECRET_ACCESS_KEY', { infer: true });
    const bucket = config.get('S3_BUCKET', { infer: true });
    if (endpoint && accessKeyId && secretAccessKey && bucket) {
      this.s3 = new S3Client({
        region,
        endpoint,
        forcePathStyle: true,
        credentials: { accessKeyId, secretAccessKey },
      });
      this.bucket = bucket;
    }
  }

  /**
   * Render + upload + link. Idempotent: if the contract already has a
   * pdfFileId pointing at a READY FileObject, returns immediately.
   */
  async generateFor(contractId: string): Promise<void> {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        order: {
          include: {
            customer: { include: { user: true } },
            address: true,
            branch: true,
          },
        },
        worker: { include: { nationality: true } },
        pdfFile: true,
      },
    });
    if (!contract) {
      this.logger.warn({ contractId }, 'pdf gen: contract not found');
      return;
    }
    if (contract.pdfFile && contract.pdfFile.status === 'READY') return;
    if (!this.s3 || !this.bucket) {
      this.logger.warn({ contractId }, 'pdf gen: S3 not configured — skipping');
      return;
    }

    const data: ContractTemplateData = {
      contractNumber: contract.contractNumber,
      orderNumber: contract.order.orderNumber,
      startDate: contract.startDate,
      endDate: contract.endDate,
      monthlySalaryMinor: contract.monthlySalaryMinor,
      currency: contract.currency,
      worker: {
        fullNameAr: contract.worker.fullNameAr,
        fullNameEn: contract.worker.fullNameEn,
        profession: contract.worker.profession,
        nationality: contract.worker.nationality.nameAr,
      },
      customer: {
        fullName:
          [contract.order.customer.firstName, contract.order.customer.lastName]
            .filter(Boolean)
            .join(' ') || 'العميل',
        phone: contract.order.customer.user.phoneE164 ?? '',
      },
      branch: {
        nameAr: contract.order.branch.nameAr,
        nameEn: contract.order.branch.nameEn,
        city: contract.order.branch.city,
        phoneE164: contract.order.branch.phoneE164,
      },
    };

    const html = renderContractHtml(data);

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await this.renderPdfWithPuppeteer(html);
    } catch (err) {
      this.logger.error({ err, contractId }, 'puppeteer pdf render failed');
      return;
    }

    const key = `contracts/${contract.id}/v${contract.pdfVersion}-${randomUUID().slice(0, 8)}.pdf`;
    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: pdfBuffer,
          ContentType: 'application/pdf',
        }),
      );
    } catch (err) {
      this.logger.error({ err, contractId, key }, 'pdf upload to S3 failed');
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      const file = await tx.fileObject.create({
        data: {
          scope: 'CONTRACT_PDF',
          bucket: this.bucket!,
          key,
          mimeType: 'application/pdf',
          sizeBytes: pdfBuffer.byteLength,
          status: 'READY',
        },
      });
      await tx.contract.update({
        where: { id: contractId },
        data: { pdfFileId: file.id, pdfVersion: { increment: 1 } },
      });
    });
    this.logger.log({ contractId, key }, 'contract pdf generated');
  }

  private async renderPdfWithPuppeteer(html: string): Promise<Buffer> {
    // Dynamic import so the API process doesn't need Chromium.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const puppeteer = await import('puppeteer').catch(() => {
      throw new Error("puppeteer not installed — run `pnpm add puppeteer` in apps/backend");
    });
    type Browser = { newPage(): Promise<Page>; close(): Promise<void> };
    type Page = {
      setContent(html: string, opts: { waitUntil: string }): Promise<void>;
      pdf(opts: Record<string, unknown>): Promise<Buffer>;
      close(): Promise<void>;
    };
    if (!this.browserPromise) {
      this.browserPromise = (puppeteer as unknown as {
        launch(opts: Record<string, unknown>): Promise<Browser>;
      }).launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
      });
    }
    const browser = (await this.browserPromise) as Browser;
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const buf = await page.pdf({ format: 'A4', printBackground: true });
      return Buffer.isBuffer(buf) ? buf : Buffer.from(buf as unknown as Uint8Array);
    } finally {
      await page.close();
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.browserPromise) {
      const browser = (await this.browserPromise) as { close(): Promise<void> };
      await browser.close().catch(() => undefined);
    }
  }
}
