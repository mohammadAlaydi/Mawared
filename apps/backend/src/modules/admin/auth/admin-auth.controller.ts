import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '@/common/decorators/public.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto, AdminLoginSchema } from './admin-login.dto';

@ApiTags('admin-auth')
@Controller({ path: 'admin/auth', version: '1' })
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(AdminLoginSchema)) body: AdminLoginDto,
    @Req() req: Request,
  ) {
    return this.auth.login(body.email, body.password, body.deviceId, body.totp, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }
}
