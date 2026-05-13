import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { FilesService } from './files.service';
import {
  FinalizeFileDto,
  FinalizeFileSchema,
  RequestUploadUrlDto,
  RequestUploadUrlSchema,
} from './dto/upload-url.dto';

@ApiTags('files')
@ApiBearerAuth()
@Roles('STAFF', 'BRANCH_MANAGER', 'SUPER_ADMIN', 'CUSTOMER')
@Controller({ path: 'files', version: '1' })
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post('upload-url')
  createUploadUrl(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(RequestUploadUrlSchema)) body: RequestUploadUrlDto,
  ) {
    return this.files.createUploadUrl(user.id, body);
  }

  @Post('finalize')
  @HttpCode(200)
  finalize(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(FinalizeFileSchema)) body: FinalizeFileDto,
  ) {
    return this.files.finalize(user.id, body.fileId);
  }
}
