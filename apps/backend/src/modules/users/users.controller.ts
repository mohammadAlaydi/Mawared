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
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { CurrentUser, type AuthUser } from '@/common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { AddressesService } from './addresses.service';
import { FavoritesService } from '@/modules/workers/favorites.service';
import { UpdateMeDto, UpdateMeSchema } from './dto/update-me.dto';
import {
  CreateAddressDto,
  CreateAddressSchema,
  UpdateAddressDto,
  UpdateAddressSchema,
} from './dto/address.dto';

@ApiTags('me')
@ApiBearerAuth()
@Controller({ path: 'me', version: '1' })
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly addresses: AddressesService,
    private readonly favorites: FavoritesService,
  ) {}

  @Get()
  getMe(@CurrentUser() user: AuthUser) {
    return this.users.getMe(user.id);
  }

  @Patch()
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(UpdateMeSchema)) body: UpdateMeDto,
  ) {
    return this.users.updateMe(user.id, body);
  }

  @Delete()
  @HttpCode(202)
  deleteMe(@CurrentUser() user: AuthUser) {
    return this.users.initiateDeletion(user.id);
  }

  // ---------- Addresses ----------

  @Get('addresses')
  listAddresses(@CurrentUser() user: AuthUser) {
    return this.addresses.list(user.id);
  }

  @Post('addresses')
  createAddress(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateAddressSchema)) body: CreateAddressDto,
  ) {
    return this.addresses.create(user.id, body);
  }

  @Patch('addresses/:id')
  updateAddress(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(UpdateAddressSchema)) body: UpdateAddressDto,
  ) {
    return this.addresses.update(user.id, id, body);
  }

  @Delete('addresses/:id')
  @HttpCode(204)
  async removeAddress(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    await this.addresses.remove(user.id, id);
  }

  // ---------- Favorites ----------

  @Get('favorites')
  listFavorites(@CurrentUser() user: AuthUser) {
    return this.favorites.list(user.id);
  }

  @Post('favorites/:workerId')
  @HttpCode(204)
  async addFavorite(
    @CurrentUser() user: AuthUser,
    @Param('workerId', new ParseUUIDPipe({ version: '4' })) workerId: string,
  ): Promise<void> {
    await this.favorites.add(user.id, workerId);
  }

  @Delete('favorites/:workerId')
  @HttpCode(204)
  async removeFavorite(
    @CurrentUser() user: AuthUser,
    @Param('workerId', new ParseUUIDPipe({ version: '4' })) workerId: string,
  ): Promise<void> {
    await this.favorites.remove(user.id, workerId);
  }
}
