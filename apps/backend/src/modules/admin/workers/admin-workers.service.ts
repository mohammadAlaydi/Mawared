import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ERROR_CODES } from '@mawared/shared-types';
import { PrismaService } from '@/shared/prisma/prisma.service';
import type { AuthUser } from '@/common/decorators/current-user.decorator';
import type { CreateWorkerDto, UpdateWorkerDto } from './dto/worker.dto';

@Injectable()
export class AdminWorkersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(actor: AuthUser) {
    const items = await this.prisma.worker.findMany({
      where: {
        deletedAt: null,
        ...(actor.role === 'BRANCH_MANAGER' && actor.branchId
          ? { branchId: actor.branchId }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { nationality: true, branch: { select: { id: true, code: true } } },
      take: 200,
    });
    return { items };
  }

  async findById(id: string, actor: AuthUser) {
    const worker = await this.prisma.worker.findFirst({
      where: { id, deletedAt: null, ...this.branchFilter(actor) },
      include: {
        nationality: true,
        languages: { include: { language: true } },
        skills: { include: { skill: true } },
        documents: { include: { file: true } },
      },
    });
    if (!worker) {
      throw new HttpException(
        { code: ERROR_CODES.WORKER_NOT_FOUND, message: 'Worker not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    return worker;
  }

  async create(body: CreateWorkerDto, actor: AuthUser) {
    if (actor.role === 'BRANCH_MANAGER' && actor.branchId && body.branchId !== actor.branchId) {
      throw new HttpException(
        { code: ERROR_CODES.AUTH_FORBIDDEN, message: 'Branch managers can only create workers in their branch.' },
        HttpStatus.FORBIDDEN,
      );
    }
    return this.prisma.worker.create({
      data: {
        branchId: body.branchId,
        nationalityId: body.nationalityId,
        fullNameAr: body.fullNameAr,
        fullNameEn: body.fullNameEn ?? null,
        profession: body.profession,
        ageYears: body.ageYears,
        experienceYears: body.experienceYears,
        bioAr: body.bioAr,
        bioEn: body.bioEn ?? null,
        monthlySalaryMinor: body.monthlySalaryMinor,
        currency: body.currency,
        availability: body.availability,
      },
    });
  }

  async update(id: string, body: UpdateWorkerDto, actor: AuthUser) {
    await this.findById(id, actor); // scope check
    const data: Prisma.WorkerUpdateInput = {
      ...(body.fullNameAr && { fullNameAr: body.fullNameAr }),
      ...(body.fullNameEn !== undefined && { fullNameEn: body.fullNameEn }),
      ...(body.profession && { profession: body.profession }),
      ...(body.ageYears !== undefined && { ageYears: body.ageYears }),
      ...(body.experienceYears !== undefined && { experienceYears: body.experienceYears }),
      ...(body.bioAr && { bioAr: body.bioAr }),
      ...(body.bioEn !== undefined && { bioEn: body.bioEn }),
      ...(body.monthlySalaryMinor !== undefined && { monthlySalaryMinor: body.monthlySalaryMinor }),
      ...(body.currency && { currency: body.currency }),
      ...(body.availability && { availability: body.availability }),
      ...(body.branchId && { branch: { connect: { id: body.branchId } } }),
      ...(body.nationalityId && { nationality: { connect: { id: body.nationalityId } } }),
    };
    return this.prisma.worker.update({ where: { id }, data });
  }

  async remove(id: string, actor: AuthUser): Promise<void> {
    await this.findById(id, actor);
    await this.prisma.worker.update({
      where: { id },
      data: { deletedAt: new Date(), availability: 'ARCHIVED' },
    });
  }

  /**
   * Bind a previously-uploaded photo FileObject to this worker.
   * Verifies the file is READY and was uploaded for WORKER_PHOTO scope.
   */
  async bindPhoto(workerId: string, fileId: string, actor: AuthUser) {
    await this.findById(workerId, actor);
    const file = await this.prisma.fileObject.findFirst({
      where: { id: fileId, scope: 'WORKER_PHOTO', status: 'READY', deletedAt: null },
      select: { id: true },
    });
    if (!file) {
      throw new HttpException(
        { code: ERROR_CODES.NOT_FOUND, message: 'File not found or not finalized.' },
        HttpStatus.NOT_FOUND,
      );
    }
    return this.prisma.worker.update({
      where: { id: workerId },
      data: { photoFileId: fileId },
      include: { photoFile: true },
    });
  }

  async addDocument(
    workerId: string,
    input: {
      fileId: string;
      kind: 'PASSPORT' | 'MEDICAL_CERT' | 'POLICE_CLEARANCE' | 'OTHER';
      expiresAt?: Date;
      notes?: string;
    },
    actor: AuthUser,
  ) {
    await this.findById(workerId, actor);
    const file = await this.prisma.fileObject.findFirst({
      where: { id: input.fileId, scope: 'WORKER_DOCUMENT', status: 'READY', deletedAt: null },
      select: { id: true },
    });
    if (!file) {
      throw new HttpException(
        { code: ERROR_CODES.NOT_FOUND, message: 'File not found or not finalized.' },
        HttpStatus.NOT_FOUND,
      );
    }
    return this.prisma.workerDocument.create({
      data: {
        workerId,
        fileId: input.fileId,
        kind: input.kind,
        expiresAt: input.expiresAt ?? null,
        notes: input.notes ?? null,
      },
    });
  }

  private branchFilter(actor: AuthUser): Prisma.WorkerWhereInput {
    if (actor.role === 'BRANCH_MANAGER' && actor.branchId) {
      return { branchId: actor.branchId };
    }
    return {};
  }
}
