import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import type { FileScope } from '@prisma/client';
import { ERROR_CODES } from '@mawared/shared-types';
import { PrismaService } from '@/shared/prisma/prisma.service';
import type { Env } from '@/shared/config/env.schema';

/**
 * S3-compatible storage adapter. Backed by Cloudflare R2 in production
 * (S3_ENDPOINT points at r2.cloudflarestorage.com). Operations:
 *   1. createUploadUrl: server picks a key, persists a PENDING FileObject,
 *      returns a presigned PUT URL.
 *   2. client uploads bytes directly to R2.
 *   3. finalize: server HEADs the object, marks the FileObject READY.
 *
 * MIME-type allow-lists per scope. Hard size cap from `RequestUploadUrlDto`.
 */
@Injectable()
export class FilesService implements OnModuleInit {
  private readonly logger = new Logger(FilesService.name);
  private s3?: S3Client;
  private bucket?: string;
  private publicBaseUrl?: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  onModuleInit(): void {
    const endpoint = this.config.get('S3_ENDPOINT', { infer: true });
    const region = this.config.get('S3_REGION', { infer: true });
    const accessKeyId = this.config.get('S3_ACCESS_KEY_ID', { infer: true });
    const secretAccessKey = this.config.get('S3_SECRET_ACCESS_KEY', { infer: true });
    const bucket = this.config.get('S3_BUCKET', { infer: true });
    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      this.logger.warn('S3 storage not configured — file uploads will fail.');
      return;
    }
    this.s3 = new S3Client({
      region,
      endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    });
    this.bucket = bucket;
    this.publicBaseUrl = this.config.get('S3_PUBLIC_BASE_URL', { infer: true });
  }

  async createUploadUrl(
    userId: string,
    input: { scope: FileScope; mimeType: string; sizeBytes: number },
  ): Promise<{ fileId: string; uploadUrl: string; method: 'PUT'; headers: Record<string, string> }> {
    if (!this.s3 || !this.bucket) {
      throw new HttpException(
        { code: ERROR_CODES.SERVICE_UNAVAILABLE, message: 'File storage not configured.' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    this.assertMimeAllowed(input.scope, input.mimeType);

    const ext = input.mimeType.split('/')[1]?.split(';')[0] ?? 'bin';
    const key = `${this.scopeFolder(input.scope)}/${randomUUID()}.${ext}`;

    const file = await this.prisma.fileObject.create({
      data: {
        scope: input.scope,
        bucket: this.bucket,
        key,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        status: 'PENDING',
        uploadedById: userId,
      },
      select: { id: true },
    });

    const url = await getSignedUrl(
      this.s3,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: input.mimeType,
        ContentLength: input.sizeBytes,
      }),
      { expiresIn: 60 * 10 },
    );

    return {
      fileId: file.id,
      uploadUrl: url,
      method: 'PUT',
      headers: { 'Content-Type': input.mimeType },
    };
  }

  async finalize(userId: string, fileId: string) {
    if (!this.s3 || !this.bucket) {
      throw new HttpException(
        { code: ERROR_CODES.SERVICE_UNAVAILABLE, message: 'File storage not configured.' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    const file = await this.prisma.fileObject.findFirst({
      where: { id: fileId, uploadedById: userId, deletedAt: null },
    });
    if (!file) {
      throw new HttpException(
        { code: ERROR_CODES.NOT_FOUND, message: 'File not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    if (file.status === 'READY') return file;

    try {
      await this.s3.send(new HeadObjectCommand({ Bucket: file.bucket, Key: file.key }));
    } catch (err) {
      this.logger.warn({ err, fileId }, 'finalize: HEAD failed — object not uploaded');
      throw new HttpException(
        { code: ERROR_CODES.NOT_FOUND, message: 'Object not found in storage.' },
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.fileObject.update({
      where: { id: fileId },
      data: { status: 'READY' },
    });
  }

  publicUrlFor(file: { bucket: string; key: string }): string | null {
    if (this.publicBaseUrl) return `${this.publicBaseUrl}/${file.key}`;
    return null;
  }

  private scopeFolder(scope: FileScope): string {
    switch (scope) {
      case 'WORKER_PHOTO':    return 'workers/photos';
      case 'WORKER_DOCUMENT': return 'workers/documents';
      case 'CUSTOMER_ID':     return 'customers/ids';
      case 'CONTRACT_PDF':    return 'contracts';
      case 'BRANCH_PHOTO':    return 'branches/photos';
      case 'SERVICE_ICON':    return 'services/icons';
    }
  }

  private assertMimeAllowed(scope: FileScope, mime: string): void {
    const allow: Record<FileScope, RegExp> = {
      WORKER_PHOTO:    /^image\/(jpeg|png|webp)$/,
      WORKER_DOCUMENT: /^(image\/(jpeg|png|webp)|application\/pdf)$/,
      CUSTOMER_ID:     /^(image\/(jpeg|png|webp)|application\/pdf)$/,
      CONTRACT_PDF:    /^application\/pdf$/,
      BRANCH_PHOTO:    /^image\/(jpeg|png|webp)$/,
      SERVICE_ICON:    /^image\/(svg\+xml|png)$/,
    };
    if (!allow[scope].test(mime)) {
      throw new HttpException(
        {
          code: ERROR_CODES.VALIDATION_FAILED,
          message: `MIME type ${mime} not allowed for scope ${scope}.`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
