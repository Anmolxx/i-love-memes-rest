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
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { API_PAGE_LIMIT } from '../constants/common.constant';
import { User } from '../users/domain/user';
import { createPaginatedResponse } from '../utils/base-response';
import { PaginatedResponse } from '../utils/dto/pagination-response.dto';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Meme } from './domain/meme';
import { CreateMemeDto } from './dto/create-meme.dto';
import {
  MemeFilterOptionsDto,
  MemeSortOptionsDto,
} from './dto/meme-filter-options.dto';
import { UpdateMemeDto } from './dto/update-meme.dto';
import { MemesService } from './memes.service';

@ApiTags('Memes')
@Controller({ path: 'memes', version: '1' })
export class MemesController {
  constructor(private readonly memesService: MemesService) {}

  @ApiCreatedResponse({ type: Meme })
  @ApiBearerAuth()
  @SerializeOptions({ groups: ['admin'] })
  @UseGuards(AuthGuard('jwt'))
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: User, @Body() createDto: CreateMemeDto) {
    const meme = await this.memesService.create(createDto, user);
    return {
      success: true,
      message: 'Meme created successfully',
      data: meme,
    };
  }

  @ApiOkResponse({ type: PaginatedResponse(Meme) })
  @SerializeOptions({ groups: ['admin'] })
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
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @CurrentUser() user: User | null,
    @Query() filterOptions: MemeFilterOptionsDto,
    @Query() sortOptions: MemeSortOptionsDto,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const safePage = page ?? 1;
    let safeLimit = limit ?? 10;
    if (safeLimit > API_PAGE_LIMIT) safeLimit = API_PAGE_LIMIT;

    const { items, meta } = await this.memesService.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions: {
        page: safePage,
        limit: safeLimit,
      } as IPaginationOptions,
      currentUserId: user?.id,
    });

    return createPaginatedResponse('Memes fetched successfully', items, meta);
  }

  @ApiOkResponse({ type: PaginatedResponse(Meme) })
  @SerializeOptions({ groups: ['admin'] })
  @UseGuards(OptionalJwtAuthGuard)
  @Get('top')
  @HttpCode(HttpStatus.OK)
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
  async findTopMemes(
    @CurrentUser() user: User | null,
    @Query() filterOptions: MemeFilterOptionsDto,
    @Query() sortOptions: MemeSortOptionsDto,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const safePage = page ?? 1;
    let safeLimit = limit ?? 10;
    if (safeLimit > API_PAGE_LIMIT) safeLimit = API_PAGE_LIMIT;

    const { items, meta } = await this.memesService.findTopMemes({
      filterOptions,
      sortOptions,
      paginationOptions: {
        page: safePage,
        limit: safeLimit,
      } as IPaginationOptions,
      currentUserId: user?.id,
    });

    return createPaginatedResponse(
      'Top memes fetched successfully',
      items,
      meta,
    );
  }

  @ApiOkResponse({ type: [Meme] })
  @ApiBearerAuth()
  @SerializeOptions({ groups: ['admin'] })
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @HttpCode(HttpStatus.OK)
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
  async findMyMemes(
    @CurrentUser() user: User,
    @Query() filterOptions: MemeFilterOptionsDto,
    @Query() sortOptions: MemeSortOptionsDto,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const safePage = page ?? 1;
    let safeLimit = limit ?? 10;
    if (safeLimit > API_PAGE_LIMIT) safeLimit = API_PAGE_LIMIT;

    const { items, meta } = await this.memesService.findMyMemes(user, {
      filterOptions,
      sortOptions,
      paginationOptions: {
        page: safePage,
        limit: safeLimit,
      } as IPaginationOptions,
    });

    return createPaginatedResponse(
      'User memes fetched successfully',
      items,
      meta,
    );
  }

  @ApiOkResponse({ type: Meme })
  @Get(':slugOrId')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'slugOrId',
    type: String,
    required: true,
    description: 'Meme slug or ID',
  })
  async findOne(@Param('slugOrId') slugOrId: string) {
    const meme = await this.memesService.findOne(slugOrId);

    return {
      success: true,
      message: 'Meme fetched successfully',
      data: meme,
    };
  }

  @ApiOkResponse({ type: Meme })
  @ApiBearerAuth()
  @SerializeOptions({ groups: ['admin'] })
  @UseGuards(AuthGuard('jwt'))
  @Patch(':slugOrId')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'slugOrId',
    type: String,
    required: true,
    description: 'Meme slug or ID',
  })
  async update(
    @Param('slugOrId') slugOrId: string,
    @Body() updateDto: UpdateMemeDto,
    @CurrentUser() user: User,
  ) {
    const meme = await this.memesService.update(slugOrId, updateDto, user);
    return {
      success: true,
      message: 'Meme updated successfully',
      data: meme,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Delete(':slugOrId')
  @ApiParam({
    name: 'slugOrId',
    type: String,
    required: true,
    description: 'Meme slug or ID',
  })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('slugOrId') slugOrId: string, @CurrentUser() user: User) {
    await this.memesService.remove(slugOrId, user);
    return {
      success: true,
      message: 'Meme deleted successfully',
    };
  }
}
