import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Public } from '@/common/decorators/public.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { LeadsService } from './leads.service';
import { CreateLeadDto, CreateLeadSchema } from './dto/create-lead.dto';

@ApiTags('leads')
@Controller({ path: 'leads', version: '1' })
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  /**
   * Anonymous website contact-form submission. Tighter throttle than the
   * default — 5 requests per IP per 10 minutes.
   */
  @Public()
  @Post()
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 10 * 60 * 1000 } })
  create(
    @Body(new ZodValidationPipe(CreateLeadSchema)) body: CreateLeadDto,
    @Req() req: Request,
  ) {
    return this.leads.create(body, { ip: req.ip, userAgent: req.headers['user-agent'] });
  }
}
