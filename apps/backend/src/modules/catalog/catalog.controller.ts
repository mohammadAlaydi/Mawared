import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { CatalogService } from './catalog.service';

/**
 * Public catalog read endpoints. Used by the marketing site (anonymous) and
 * the customer Android app (authenticated). Catalog data is non-sensitive:
 * service categories and package pricing are intended to be discoverable.
 */
@ApiTags('catalog')
@Controller({ version: '1' })
export class CatalogController {
  constructor(private readonly catalog: CatalogService)