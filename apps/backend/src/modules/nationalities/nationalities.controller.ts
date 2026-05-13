import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { NationalitiesService } from './nationalities.service';

/**
 * GET /v1/nationalities — small, public reference list used by:
 *  - The admin dashboard's worker-create form (foreign-key picker).
 *  - The customer-facing mobile + web apps (worker search facets).
 *
 * The set rarely changes (a handful of countries), so we don't paginate.
 */
@ApiTags('nationalities')
@Controller({ path: 'nationalities', version: '1' })
export class NationalitiesController {
  constructor(private readonly nationalities: NationalitiesService) {}

  @Public()
  @Get()
  list() {
    return this.nationalities.list();
  }
}
