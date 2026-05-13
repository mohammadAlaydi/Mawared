import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '@/common/decorators/current-user.decorator';
import { ContractsService } from './contracts.service';

@ApiTags('contracts')
@ApiBearerAuth()
@Controller({ version: '1' })
export class ContractsController {
  constructor(private readonly contracts: ContractsService) {}

  /**
   * Lists every contract attached to the customer's orders, newest first.
   * Powers the Android "My Contracts" screen.
   */
  @Get('me/contracts')
  listMyContracts(@CurrentUser() user: AuthUser) {
    return this.contracts.listForCustomer(user.id);
  }

  /**
   * Returns the contract metadata for a single order. PDF download is via
   * `/v1/files/:fileId/signed-url` using the `pdfFileId` from this response.
   */
  @Get('orders/:id/contract')
  findForOrder(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.contracts.findForCustomer(user.id, id);
  }
}
