import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { Meme } from 'src/memes/domain/meme';
import { CreateTemplateResponseDto } from 'src/templates/dto/response/create-template.response.dto';
import {
  API_PAGE_LIMIT,
  extractQueryOptions,
  IPaginationOptions,
} from 'src/utils';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';
import {
  createPaginatedResponse,
  createResponse,
} from '../utils/base-response';
import { PaginatedResponse } from '../utils/dto/pagination-response.dto';
import { Template } from './domain/template';
import { CreateTemplateDto } from './dto/create-template.dto';
import {
  TemplateQueryDto,
  TemplateSortField,
} from './dto/template-filter-options.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplateService } from './templates.service';

@ApiTags('Template')
@Controller({
  path: 'templates',
  version: '1',
})
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post()
  @ApiCreatedResponse({ type: CreateTemplateResponseDto })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createTemplateDto: CreateTemplateDto,
    @CurrentUser() user: JwtPayloadType,
  ) {
    const result = await this.templateService.create(createTemplateDto, user);
    return createResponse('Template Created Successfully', result);
  }

  @ApiOkResponse({ type: PaginatedResponse(Meme) })
  @SerializeOptions({ groups: ['admin', 'user'] })
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAll(@Query() query: TemplateQueryDto) {
    const { paginationOptions, sortOptions, filterOptions } =
      extractQueryOptions<TemplateSortField>(query, API_PAGE_LIMIT);

    const { items, meta } = await this.templateService.getAll({
      paginationOptions,
      sortOptions,
      filterOptions,
    });

    return createPaginatedResponse(
      'Templates fetched successfully',
      items,
      meta,
    );
  }

  @Get(':slugOrId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Template })
  async getById(@Param('slugOrId') slugOrId: string) {
    const result = await this.templateService.findOne(slugOrId);
    return createResponse('Template Fetched Successfully', result);
  }

  @Patch(':slugOrId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOkResponse({ type: Template })
  @HttpCode(HttpStatus.OK)
  async update(
    @Body() updateTemplateDto: UpdateTemplateDto,
    @Param('slugOrId') slugOrId: string,
    @CurrentUser() user: JwtPayloadType,
  ) {
    const result = await this.templateService.update(
      slugOrId,
      updateTemplateDto,
      user,
    );

    return createResponse('Template Updated Successfully', result);
  }

  @Delete(':slugOrId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('slugOrId') slugOrId: string) {
    await this.templateService.delete(slugOrId);
  }

  @ApiOkResponse({ type: PaginatedResponse(Template) })
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('deleted')
  @HttpCode(HttpStatus.OK)
  async getDeleted(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    const safePage = page ?? 1;
    let safeLimit = limit ?? 10;
    if (safeLimit > API_PAGE_LIMIT) safeLimit = API_PAGE_LIMIT;

    const { items, meta } =
      await this.templateService.findDeletedWithPagination({
        paginationOptions: {
          page: safePage,
          limit: safeLimit,
        } as IPaginationOptions,
        sortOptions: { orderBy: 'createdAt', order: 'DESC' },
        filterOptions: { search },
      } as any);

    return createPaginatedResponse(
      'Deleted templates fetched successfully',
      items,
      meta,
    );
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch(':slugOrId/restore')
  @HttpCode(HttpStatus.OK)
  async restore(
    @Param('slugOrId') slugOrId: string,
    @CurrentUser() user: JwtPayloadType,
  ) {
    const restored = await this.templateService.restore(slugOrId, user);
    return createResponse('Template restored successfully', restored);
  }

  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Delete(':slugOrId/permanent')
  @HttpCode(HttpStatus.NO_CONTENT)
  async hardDelete(@Param('slugOrId') slugOrId: string) {
    await this.templateService.hardDelete(slugOrId);
  }
}
