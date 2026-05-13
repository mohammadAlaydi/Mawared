import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { CurrentUser, type AuthUser } from '@/common/decorators/current-user.decorator';
import { OffersService } from './offers.service';
import { ValidateOfferDto, ValidateOfferSchema } from './dto/validate-offer.dto';

@ApiTags('offers')
@ApiBearerAuth()
@Controller({ path: 'offers', version: '1' })
export class OffersController {
  constructor(private readonly offers: OffersService) {}

  @Get()
  list() {
    return this.offers.listActive();
  }

  @Post('validate')
  @HttpCode(200)
  async validate(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(ValidateOfferSchema)) body: ValidateOfferDto,
  ) {
    const res = await this.offers.validate(body.code, {
      customerId: user.id,
      subtotalMinor: body.subtotalMinor,
      currency: body.currency,
    });
    return {
      ...res,
      discountMinor: res.discountMinor.toString(),
    };
  }
}
