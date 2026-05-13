import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { ERROR_CODES } from '@mawared/shared-types';
import { CurrentUser, type AuthUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { generateTotpSecret, generateTotpUri, verifyTotp } from './totp';

const VerifyTotpSchema = z.object({ code: z.string().regex(/^\d{6}$/) }).strict();

@ApiTags('admin-totp')
@ApiBearerAuth()
@Roles('STAFF', 'BRANCH_MANAGER', 'SUPER_ADMIN')
@Controller({ path: 'admin/auth/totp', version: '1' })
export class AdminTotpController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Begin enrollment. Generates a secret + otpauth:// URI for the user's
   * authenticator app. The secret is persisted but `totpEnabled` stays
   * false until `verify` succeeds.
   */
  @Post('enroll')
  @HttpCode(200)
  async enroll(@CurrentUser() user: AuthUser) {
    const u = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { email: true, totpEnabled: true },
    });
    if (u.totpEnabled) {
      throw new HttpException(
        { code: ERROR_CODES.CONFLICT, message: 'TOTP already enrolled. Disable first.' },
        HttpStatus.CONFLICT,
      );
    }
    const secret = generateTotpSecret();
    await this.prisma.user.update({
      where: { id: user.id },
      data: { totpSecret: secret, totpEnabled: false },
    });
    const uri = generateTotpUri({
      secretBase32: secret,
      accountName: u.email ?? user.id,
      issuer: 'Mawared International',
    });
    return { secret, otpauthUri: uri };
  }

  /**
   * Confirm enrollment by submitting a code from the authenticator.
   * Sets `totpEnabled = true` on success.
   */
  @Post('verify')
  @HttpCode(204)
  async verify(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(VerifyTotpSchema)) body: z.infer<typeof VerifyTotpSchema>,
  ): Promise<void> {
    const u = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { totpSecret: true },
    });
    if (!u.totpSecret) {
      throw new HttpException(
        { code: ERROR_CODES.CONFLICT, message: 'No TOTP enrollment in progress.' },
        HttpStatus.CONFLICT,
      );
    }
    if (!verifyTotp(u.totpSecret, body.code)) {
      throw new HttpException(
        { code: ERROR_CODES.AUTH_INVALID_OTP, message: 'Invalid TOTP code.' },
        HttpStatus.UNAUTHORIZED,
      );
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { totpEnabled: true },
    });
  }

  @Post('disable')
  @HttpCode(204)
  async disable(@CurrentUser() user: AuthUser): Promise<void> {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { totpEnabled: false, totpSecret: null },
    });
  }
}
