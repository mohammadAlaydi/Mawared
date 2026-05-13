import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { WorkersService } from './workers.service';
import { SearchWorkersDto, SearchWorkersSchema } from './dto/search-workers.dto';

@ApiTags('workers')
@ApiBearerAuth()
@Controller({ path: 'workers', version: '1' })
export class WorkersController {
  constructor(private readonly workers: WorkersService) {}

  @Get()
  search(@Query(new ZodValidationPipe(SearchWorkersSchema)) q: SearchWorkersDto) {
    return this.workers.search(q);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.workers.findById(id);
  }
}
