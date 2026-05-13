import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '@/common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { NotificationsService } from './notifications.service';
import { DeviceTokensService } from './device-tokens.service';
import { RegisterDeviceDto, RegisterDeviceSchema } from './dto/register-device.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller({ version: '1' })
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly deviceTokens: DeviceTokensService,
  ) {}

  @Get('notifications')
  list(@CurrentUser() user: AuthUser) {
    return this.notifications.listForUser(user.id);
  }

  @Patch('notifications/:id/read')
  @HttpCode(204)
  async read(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    await this.notifications.markRead(user.id, id);
  }

  @Post('devices')
  @HttpCode(204)
  async registerDevice(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(RegisterDeviceSchema)) body: RegisterDeviceDto,
  ): Promise<void> {
    await this.deviceTokens.register(user.id, body);
  }

  @Delete('devices/:token')
  @HttpCode(204)
  async unregisterDevice(
    @CurrentUser() user: AuthUser,
    @Param('token') token: string,
  ): Promise<void> {
    await this.deviceTokens.unregister(user.id, token);
  }
}
