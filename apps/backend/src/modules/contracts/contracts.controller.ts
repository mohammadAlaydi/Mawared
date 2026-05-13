import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '@/common/decorators/current-user.decorator';
import { ContractsService } from './contracts.service';

@ApiTags('contracts')
@ApiBearerAuth()
@Controller({ path: 'orders', version: '1' })
export class ContractsController {
  constructor(private readonly contracts: ContractsService) {}

  /**
   * Returns the contract metadata for the customer's order. PDF download
   * via presigned R2 URL lands when the files module is wired (M3+).
   */
  @Get(':id/contract')
  findForOrder(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.contracts.findForCustomer(user.id, id);
  }
}
