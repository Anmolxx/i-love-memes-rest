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
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';
import { Tag } from './domain/tag';
import { CreateTagDto } from './dto/create-tag.dto';
import { FindOrCreateTagsDto } from './dto/find-or-create-tags.dto';
import { QueryTagDto } from './dto/query-tag.dto';
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
  @ApiOkResponse({ type: [Tag] })
  findAll(@Query() query: QueryTagDto): Promise<Tag[]> {
    return this.tagsService.findAll(query);
  }

  @Get('search')
  @ApiOkResponse({ type: [Tag] })
  search(@Query('q') query: string): Promise<Tag[]> {
    return this.tagsService.search(query);
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({ type: Tag })
  findOne(@Param('id') id: string): Promise<Tag> {
    return this.tagsService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiParam({
    name: 'slug',
    type: String,
    required: true,
  })
  @ApiOkResponse({ type: Tag })
  findBySlug(@Param('slug') slug: string): Promise<Tag> {
    return this.tagsService.findBySlug(slug);
  }

  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({ type: Tag })
  update(
    @Param('id') id: string,
    @Body() updateTagDto: UpdateTagDto,
  ): Promise<Tag> {
    return this.tagsService.update(id, updateTagDto);
  }

  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.tagsService.remove(id);
  }
}
