import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  SerializeOptions,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateMemeDto } from './dto/create-meme.dto';
import { UpdateMemeDto } from './dto/update-meme.dto';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MemesService } from './memes.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/domain/user';
import { AuthGuard } from '@nestjs/passport';
import { Meme } from './domain/meme';
import { MemeParamsDto } from './dto/meme-params.dto';
import { MemeListQueryDto } from './dto/meme-list-query.dto';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { PaginatedResponse } from '../utils/dto/pagination-response.dto';
import { API_PAGE_LIMIT } from '../constants/common.constant';
import { createResponse } from '../utils/base-response';

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
  @Get(':memeId')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'memeId', type: String, required: true })
  async findOne(@Param() params: MemeParamsDto) {
    const meme = await this.memesService.findById(params.memeId);
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
  @Patch(':memeId')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'memeId', type: String, required: true })
  async update(
    @Param() params: MemeParamsDto,
    @Body() updateDto: UpdateMemeDto,
    @CurrentUser() user: User,
  ) {
    const meme = await this.memesService.update(params.memeId, updateDto, user);
    return {
      success: true,
      message: 'Meme updated successfully',
      data: meme,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Delete(':id')
  @ApiParam({ name: 'memeId', type: String, required: true })
  @HttpCode(HttpStatus.OK)
  async remove(@Param() params: MemeParamsDto, @CurrentUser() user: User) {
    await this.memesService.remove(params.memeId, user);
    return {
      success: true,
      message: 'Meme deleted successfully',
    };
  }
}
