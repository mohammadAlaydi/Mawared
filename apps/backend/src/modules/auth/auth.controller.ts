import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Ip,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ERROR_CODES } from '@mawared/shared-types';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser, type AuthUser } from '@/common/decorators/current-user.decorator';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import { SessionService } from './session.service';
import { OtpRequestDto } from './dto/otp-request.dto';
import { OtpVerifyDto } from './dto/otp-verify.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly otp: OtpService,
    private readonly tokens: TokenService,
    private readonly sessions: SessionService,
    private readonly prisma: PrismaService,
  ) {}

  /** Request an OTP. Always 204 — we don't reveal whether the phone exists. */
  @Public()
  @Post('otp/request')
  @HttpCode(204)
  async requestOtp(@Body() body: OtpRequestDto, @Ip() ip: string): Promise<void> {
    await this.otp.request(body.phone, body.locale, ip);
  }

  /** Verify an OTP and exchange it for tokens. Auto-creates the customer if new. */
  @Public()
  @Post('otp/verify')
  @HttpCode(200)
  async verifyOtp(@Body() body: OtpVerifyDto, @Req() req: Request) {
    await this.otp.verify(body.phone, body.code);

    // Upsert the user + customer profile.
    const user = await this.prisma.user.upsert({
      where: { phoneE164: body.phone },
      update: { isActive: true },
      create: {
        phoneE164: body.phone,
        role: 'CUSTOMER',
        isActive: true,
        customer: { create: { preferredLocale: 'ar' } },
      },
    });

    const sessionId = await this.sessions.createOrGet(user.id, body.deviceId, body.deviceName, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const tokens = await this.tokens.issueForCustomer(
      user.id,
      sessionId,
      user.role,
      undefined,
      undefined,
      { ip: req.ip, userAgent: req.headers['user-agent'] },
    );

    return {
      tokenType: 'Bearer',
      ...tokens,
      user: { id: user.id, role: user.role, phoneE164: user.phoneE164 },
    };
  }

  @Public()
  @Post('token/refresh')
  @HttpCode(200)
  async refresh(@Body() body: RefreshTokenDto, @Req() req: Request) {
    const tokens = await this.tokens.refresh(body.refreshToken, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return { tokenType: 'Bearer', ...tokens };
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(@Body() body: RefreshTokenDto): Promise<void> {
    await this.tokens.revoke(body.refreshToken);
  }

  @Get('sessions')
  async listSessions(@CurrentUser() user: AuthUser) {
    return { items: await this.sessions.listForUser(user.id) };
  }

  @Delete('sessions/:id')
  @HttpCode(204)
  async revokeSession(
    @CurrentUser() user: AuthUser | undefined,
    @Param('id') id: string,
  ): Promise<void> {
    if (!user) {
      throw new HttpException(
        { code: ERROR_CODES.AUTH_UNAUTHENTICATED, message: 'Not authenticated.' },
        HttpStatus.UNAUTHORIZED,
      );
    }
    await this.sessions.revoke(user.id, id);
  }
}
