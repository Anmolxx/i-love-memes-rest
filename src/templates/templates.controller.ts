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
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { API_PAGE_LIMIT } from '../constants/common.constant';
import {
  createPaginatedResponse,
  createResponse,
} from '../utils/base-response';
import { PaginatedResponse } from '../utils/dto/pagination-response.dto';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Template } from './domain/template';
import { CreateTemplateDto } from './dto/create-template.dto';
import { CreateTemplateResponseDto } from './dto/response/create-template.response.dto';
import { TemplateSortField } from './dto/template-filter-options.dto';
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

  @Get()
  @ApiOkResponse({ type: PaginatedResponse(Template) })
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description:
      'Search term for template title/description (partial, case-insensitive)',
    example: 'funny',
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    type: Array<string>,
    description: 'Filter templates by tags (comma-separated tag names)',
    example: 'funny',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    enum: ['createdAt', 'updatedAt', 'title'],
    description: 'Field to sort templates by',
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort direction',
    example: 'DESC',
  })
  async getAll(
    @Query('search') search?: string,
    @Query('tags') tags?: Array<string>,
    @Query('orderBy') orderBy?: TemplateSortField,
    @Query('order') order?: 'ASC' | 'DESC',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const safePage = page ?? 1;
    let safeLimit = limit ?? 10;
    if (safeLimit > API_PAGE_LIMIT) {
      safeLimit = API_PAGE_LIMIT;
    }

    const sortOrder = order ?? 'DESC';
    const sortField = orderBy ?? TemplateSortField.CREATED_AT;

    // Parse tags if provided
    let parsedTags: Array<string> | undefined;

    switch (typeof tags) {
      case 'string':
        parsedTags = (tags as string).split(',').map((tag) => tag.trim());
        break;
      case 'object':
        parsedTags = tags;
        break;
      default:
        parsedTags = undefined;
        break;
    }

    const { items, meta } = await this.templateService.getAll({
      paginationOptions: {
        page: safePage,
        limit: safeLimit,
      } as IPaginationOptions,
      sortOptions: {
        orderBy: sortField,
        order: sortOrder as 'ASC' | 'DESC',
      },
      filterOptions: {
        search: search,
        tags: parsedTags,
      },
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
}
