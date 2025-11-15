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
import { API_PAGE_LIMIT } from '../constants/common.constant';
import { createPaginatedResponse } from 'src/utils/base-response';
import { PaginatedResponse } from 'src/utils/dto/pagination-response.dto';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';
import { Tag } from './domain/tag';
import { CreateTagDto } from './dto/create-tag.dto';
import { FindOrCreateTagsDto } from './dto/find-or-create-tags.dto';
import {
  TagFilterOptionsDto,
  TagSortOptionsDto,
} from './dto/tag-filter-options.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagsService } from './tags.service';

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
  async findAll(
    @Query() filterOptions: TagFilterOptionsDto,
    @Query() sortOptions: TagSortOptionsDto,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const safePage = page ?? 1;
    let safeLimit = limit ?? 10;
    if (safeLimit > API_PAGE_LIMIT) safeLimit = API_PAGE_LIMIT;

    const { items, meta } = await this.tagsService.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions: {
        page: safePage,
        limit: safeLimit,
      },
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
}
