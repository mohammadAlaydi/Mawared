import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';

@ApiTags('catalog')
@ApiBearerAuth()
@Controller({ version: '1' })
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('services')
  listServices() {
    return this.catalog.listServices();
  }

  @Get('services/:id/packages')
  listPackages(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.catalog.listPackages(id);
  }
}
