import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Response,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiTags,
} from '@nestjs/swagger';
import { FileType } from 'src/files/domain/file';
import { Roles } from 'src/roles/roles.decorator';
import { RoleEnum } from 'src/roles/roles.enum';
import { createPaginatedResponse } from 'src/utils/base-response';
import {
  PaginatedResponse,
  PaginationMetaDto,
} from '../../../../utils/dto/pagination-response.dto';
import { FileResponseDto } from './dto/file-response.dto';
import { FilesLocalService } from './files.service';

@ApiTags('Files')
@Controller({
  path: 'files',
  version: '1',
})
export class FilesLocalController {
  constructor(private readonly filesService: FilesLocalService) {}

  @ApiCreatedResponse({
    type: FileResponseDto,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<FileResponseDto> {
    return this.filesService.create(file);
  }

  @Get(':path')
  @ApiExcludeEndpoint()
  download(@Param('path') path, @Response() response) {
    return response.sendFile(path, { root: './files' });
  }

  @Delete(':fileId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiCreatedResponse({
    description: 'File deleted successfully.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFile(
    @Param('fileId', new ParseUUIDPipe()) fileId: string,
  ): Promise<void> {
    await this.filesService.delete(fileId);
  }

  @Get('admin/files')
  @Roles(RoleEnum.admin)
  @ApiBearerAuth()
  @ApiCreatedResponse({
    type: PaginatedResponse(FileType),
  })
  async getPaginatedFiles(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const { items, totalItems } = await this.filesService.getPaginatedFiles(
      page,
      limit,
    );
    const meta: PaginationMetaDto = {
      currentPage: page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    };

    return createPaginatedResponse(
      'User memes fetched successfully',
      items,
      meta,
    );
  }
}
