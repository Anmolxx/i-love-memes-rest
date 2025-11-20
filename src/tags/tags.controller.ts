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
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { createPaginatedResponse } from 'src/utils/base-response';
import { PaginatedResponse } from 'src/utils/dto/pagination-response.dto';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';
import { Tag } from './domain/tag';
import { CreateTagDto } from './dto/create-tag.dto';
import { FindOrCreateTagsDto } from './dto/find-or-create-tags.dto';
import { TagQueryDto, TagSortField } from './dto/tag-filter-options.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagsService } from './tags.service';
import { extractQueryOptions, API_PAGE_LIMIT } from 'src/utils';

@ApiTags('Tags')
@Controller({
  path: 'tags',
  version: '1',
})
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post()
  @ApiCreatedResponse({ type: Tag })
  create(@Body() createTagDto: CreateTagDto): Promise<Tag> {
    return this.tagsService.create(createTagDto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('find-or-create')
  @ApiCreatedResponse({ type: [Tag] })
  findOrCreate(@Body() findOrCreateDto: FindOrCreateTagsDto): Promise<Tag[]> {
    return this.tagsService.findOrCreate(findOrCreateDto);
  }

  @Get()
  @ApiOkResponse({ type: PaginatedResponse(Tag) })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: TagQueryDto) {
    const { paginationOptions, sortOptions, filterOptions } =
      extractQueryOptions<TagSortField>(query, API_PAGE_LIMIT);

    const { items, meta } = await this.tagsService.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });

    return createPaginatedResponse('tags fetched successfully', items, meta);
  }

  @Get(':slugOrId')
  @ApiParam({
    name: 'slugOrId',
    type: String,
    required: true,
    description: 'Tag slug or ID',
  })
  @ApiOkResponse({ type: Tag })
  findOne(@Param('slugOrId') slugOrId: string): Promise<Tag> {
    return this.tagsService.findOne(slugOrId);
  }

  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Patch(':slugOrId')
  @ApiParam({
    name: 'slugOrId',
    type: String,
    required: true,
    description: 'Tag slug or ID',
  })
  @ApiOkResponse({ type: Tag })
  update(
    @Param('slugOrId') slugOrId: string,
    @Body() updateTagDto: UpdateTagDto,
  ): Promise<Tag> {
    return this.tagsService.update(slugOrId, updateTagDto);
  }

  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Delete(':slugOrId')
  @ApiParam({
    name: 'slugOrId',
    type: String,
    required: true,
    description: 'Tag slug or ID',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('slugOrId') slugOrId: string): Promise<void> {
    return this.tagsService.remove(slugOrId);
  }

  @ApiOkResponse({ type: PaginatedResponse(Tag) })
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('deleted')
  @HttpCode(HttpStatus.OK)
  async findDeleted(@Query() query: TagQueryDto) {
    const { paginationOptions, sortOptions, filterOptions } =
      extractQueryOptions<TagSortField>(query, API_PAGE_LIMIT);

    const { items, meta } = await this.tagsService.findDeletedWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });

    return createPaginatedResponse(
      'Deleted tags fetched successfully',
      items,
      meta,
    );
  }

  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Patch(':slugOrId/restore')
  @ApiParam({ name: 'slugOrId', type: String, required: true })
  @HttpCode(HttpStatus.OK)
  async restore(@Param('slugOrId') slugOrId: string) {
    const restored = await this.tagsService.restore(slugOrId);
    return restored;
  }

  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Delete(':slugOrId/permanent')
  @ApiParam({ name: 'slugOrId', type: String, required: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  async hardDelete(@Param('slugOrId') slugOrId: string) {
    await this.tagsService.hardDelete(slugOrId);
  }
}
