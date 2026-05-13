import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ERROR_CODES } from '@mawared/shared-types';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { generateContractNumber } from './contract-number';
import { ContractPdfService } from './contract-pdf.service';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdf: ContractPdfService,
  ) {}

  /**
   * Issue a contract for a CONFIRMED order. Idempotent: if a contract
   * already exists for the order, returns it unchanged.
   *
   * PDF generation is deferred (Puppeteer + Noto Sans Arabic). For now we
   * persist the contract row; pdfFileId is null until the PDF job runs.
   */
  async issueFor(orderId: string): Promise<{ id: string; contractNumber: string }> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, deletedAt: null },
      select: {
        id: true,
        status: true,
        workerId: true,
        currency: true,
        package: { select: { durationValue: true, durationUnit: true } },
        worker: { select: { id: true, monthlySalaryMinor: true, currency: true } },
        contract: { select: { id: true, contractNumber: true } },
      },
    });
    if (!order) {
      throw new HttpException(
        { code: ERROR_CODES.ORDER_NOT_FOUND, message: 'Order not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    if (order.contract) {
      return { id: order.contract.id, contractNumber: order.contract.contractNumber };
    }
    if (!order.workerId || !order.worker) {
      throw new HttpException(
        { code: ERROR_CODES.WORKER_NOT_FOUND, message: 'Order has no assigned worker.' },
        HttpStatus.CONFLICT,
      );
    }
    if (order.status !== 'CONFIRMED') {
      throw new HttpException(
        {
          code: ERROR_CODES.ORDER_INVALID_TRANSITION,
          message: `Contract can only be issued for CONFIRMED orders (got ${order.status}).`,
        },
        HttpStatus.CONFLICT,
      );
    }

    // Compute contract window from package duration.
    const startDate = new Date();
    const endDate = this.addDuration(
      startDate,
      order.package.durationValue,
      order.package.durationUnit,
    );

    // Retry on the (very unlikely) contractNumber collision.
    for (let attempt = 0; attempt < 5; attempt++) {
      const contractNumber = generateContractNumber();
      try {
        const created = await this.prisma.contract.create({
          data: {
            contractNumber,
            orderId: order.id,
            workerId: order.workerId,
            status: 'ACTIVE',
            startDate,
            endDate,
            monthlySalaryMinor: order.worker.monthlySalaryMinor,
            currency: order.worker.currency,
          },
        });
        this.logger.log(
          { orderId, contractId: created.id, contractNumber },
          'contract issued',
        );
        // Fire-and-forget PDF render. Failures here MUST NOT break the
        // CONFIRMED transition that triggered us.
        queueMicrotask(() => {
          this.pdf.generateFor(created.id).catch((err) =>
            this.logger.warn({ err, contractId: created.id }, 'contract pdf generation failed'),
          );
        });
        return { id: created.id, contractNumber };
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002' &&
          attempt < 4
        ) {
          continue;
        }
        throw err;
      }
    }
    throw new Error('Failed to issue contract after 5 attempts');
  }

  async findForCustomer(customerId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId, deletedAt: null },
      select: { id: true },
    });
    if (!order) {
      throw new HttpException(
        { code: ERROR_CODES.ORDER_NOT_FOUND, message: 'Order not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    const contract = await this.prisma.contract.findUnique({
      where: { orderId },
      include: { pdfFile: { select: { bucket: true, key: true, status: true } } },
    });
    if (!contract) {
      throw new HttpException(
        { code: ERROR_CODES.NOT_FOUND, message: 'Contract not yet issued.' },
        HttpStatus.NOT_FOUND,
      );
    }
    return contract;
  }

  async voidContract(contractId: string, reason: string): Promise<void> {
    await this.prisma.contract.update({
      where: { id: contractId },
      data: { status: 'VOIDED', voidedAt: new Date(), voidReason: reason },
    });
  }

  private addDuration(start: Date, value: number, unit: string): Date {
    const d = new Date(start);
    switch (unit) {
      case 'HOUR':  d.setUTCHours(d.getUTCHours() + value); return d;
      case 'DAY':   d.setUTCDate(d.getUTCDate() + value);   return d;
      case 'WEEK':  d.setUTCDate(d.getUTCDate() + value * 7); return d;
      case 'MONTH': d.setUTCMonth(d.getUTCMonth() + value); return d;
      default:      d.setUTCMonth(d.getUTCMonth() + value); return d;
    }
  }
}
