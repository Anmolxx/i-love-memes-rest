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
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { API_PAGE_LIMIT } from '../constants/common.constant';
import { User } from '../users/domain/user';
import { createResponse } from '../utils/base-response';
import { PaginatedResponse } from '../utils/dto/pagination-response.dto';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Meme } from './domain/meme';
import { CreateMemeDto } from './dto/create-meme.dto';
import { MemeListQueryDto } from './dto/meme-list-query.dto';
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
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: MemeListQueryDto) {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > API_PAGE_LIMIT) limit = API_PAGE_LIMIT;
    let sortOptions: {
      orderBy: string;
      order: 'ASC' | 'DESC';
    } = {
      orderBy: 'createdAt',
      order: 'DESC',
    };

    if (query?.orderBy) {
      sortOptions = {
        orderBy: query?.orderBy,
        order: query?.order === 'asc' ? 'ASC' : 'DESC',
      };
    }

    const { data, total } = await this.memesService.findManyWithPagination({
      filterOptions: { search: query?.search },
      sortOptions,
      paginationOptions: { page, limit } as IPaginationOptions,
    });

    const metaData = {
      currentPage: page,
      limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit) || 1,
    };

    return createResponse('Memes fetched successfully', data, metaData);
  }

  @ApiOkResponse({ type: [Meme] })
  @ApiBearerAuth()
  @SerializeOptions({ groups: ['admin'] })
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async findMyMemes(@CurrentUser() user: User) {
    const memes = await this.memesService.findMyMemes(user);
    return {
      success: true,
      message: 'User memes fetched successfully',
      data: memes,
    };
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
    console.log(meme);
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
