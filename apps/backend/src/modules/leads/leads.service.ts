import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import type { CreateLeadDto } from './dto/create-lead.dto';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  create(body: CreateLeadDto, meta: { ip?: string; userAgent?: string }) {
    return this.prisma.lead.create({
      data: {
        fullName: body.fullName,
        phoneE164: body.phone,
        email: body.email ?? null,
        message: body.message,
        source: body.source ?? null,
        ipAddress: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
      },
      select: { id: true, createdAt: true },
    });
  }
}
