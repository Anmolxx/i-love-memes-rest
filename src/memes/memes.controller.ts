import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Res,
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
import { Response } from 'express';
import { API_PAGE_LIMIT, extractQueryOptions } from 'src/utils';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { User } from '../users/domain/user';
import { createPaginatedResponse } from '../utils/base-response';
import { PaginatedResponse } from '../utils/dto/pagination-response.dto';
import { Meme } from './domain/meme';
import { CreateMemeDto } from './dto/create-meme.dto';
import { MemeQueryDto, MemeSortField } from './dto/meme-filter-options.dto';
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
  @SerializeOptions({ groups: ['admin', 'user'] })
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @CurrentUser() user: User | null,
    @Query() query: MemeQueryDto,
  ) {
    const { paginationOptions, sortOptions, filterOptions } =
      extractQueryOptions<MemeSortField>(query, API_PAGE_LIMIT);

    // Admin-only filters: reported, interactionType, reasons
    if (
      filterOptions?.reported === true ||
      filterOptions?.flagged === true ||
      Boolean(filterOptions?.interactionType) ||
      (filterOptions?.reasons && filterOptions.reasons.length > 0)
    ) {
      if (!user || user?.role?.name?.toLowerCase() !== 'admin') {
        throw new ForbiddenException(
          'Only admins can use moderation filters (reported/interactionType/reasons/flagged)',
        );
      }
    }

    const { items, meta } = await this.memesService.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
      currentUserId: user?.id,
    });

    return createPaginatedResponse('Memes fetched successfully', items, meta);
  }

  @ApiOkResponse({ type: PaginatedResponse(Meme) })
  @SerializeOptions({ groups: ['admin', 'user'] })
  @UseGuards(OptionalJwtAuthGuard)
  @Get('top')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  async findTopMemes(
    @CurrentUser() user: User | null,
    @Query() query: MemeQueryDto,
  ) {
    const { paginationOptions, sortOptions, filterOptions } =
      extractQueryOptions<MemeSortField>(query, API_PAGE_LIMIT);

    // Admin-only filters: reported, interactionType, reasons
    if (
      filterOptions?.reported === true ||
      filterOptions?.flagged === true ||
      Boolean(filterOptions?.interactionType) ||
      (filterOptions?.reasons && filterOptions.reasons.length > 0)
    ) {
      if (!user || user?.role?.name?.toLowerCase() !== 'admin') {
        throw new ForbiddenException(
          'Only admins can use moderation filters (reported/interactionType/reasons/flagged)',
        );
      }
    }

    const { items, meta } = await this.memesService.findTopMemes({
      filterOptions,
      sortOptions,
      paginationOptions,
      currentUserId: user?.id,
    });

    return createPaginatedResponse(
      'Top memes fetched successfully',
      items,
      meta,
    );
  }

  @ApiOkResponse({ type: PaginatedResponse(Meme) })
  @ApiBearerAuth()
  @SerializeOptions({ groups: ['admin', 'user'] })
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async findMyMemes(@CurrentUser() user: User, @Query() query: MemeQueryDto) {
    const { paginationOptions, sortOptions, filterOptions } =
      extractQueryOptions<MemeSortField>(query, API_PAGE_LIMIT);

    const { items, meta } = await this.memesService.findMyMemes(user, {
      filterOptions,
      sortOptions,
      paginationOptions,
    });

    return createPaginatedResponse(
      'User memes fetched successfully',
      items,
      meta,
    );
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: PaginatedResponse(Meme) })
  @SerializeOptions({ groups: ['admin'] })
  @UseGuards(AuthGuard('jwt'))
  @Get('deleted')
  @HttpCode(HttpStatus.OK)
  async findDeleted(@Query() query: MemeQueryDto) {
    const { paginationOptions, sortOptions, filterOptions } =
      extractQueryOptions<MemeSortField>(query, API_PAGE_LIMIT);

    const { items, meta } = await this.memesService.findDeletedWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });

    return createPaginatedResponse(
      'Deleted memes fetched successfully',
      items,
      meta,
    );
  }

  @ApiOkResponse({ type: PaginatedResponse(Meme) })
  @SerializeOptions({ groups: ['admin'] })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('me/deleted')
  @HttpCode(HttpStatus.OK)
  async findMyDeleted(@CurrentUser() user: User, @Query() query: MemeQueryDto) {
    const { paginationOptions, sortOptions, filterOptions } =
      extractQueryOptions<MemeSortField>(query, API_PAGE_LIMIT);

    const { items, meta } = await this.memesService.findMyDeleted(user, {
      filterOptions,
      sortOptions,
      paginationOptions,
    });

    return createPaginatedResponse(
      'User deleted memes fetched successfully',
      items,
      meta,
    );
  }

  @ApiOkResponse({ type: Meme })
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':slugOrId')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'slugOrId',
    type: String,
    required: true,
    description: 'Meme slug or ID',
  })
  async findOne(
    @CurrentUser() user: User | null,
    @Param('slugOrId') slugOrId: string,
  ) {
    const meme = await this.memesService.findOne(slugOrId, user?.id);

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

  @ApiOkResponse({ type: Meme })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch(':slugOrId/restore')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'slugOrId',
    type: String,
    required: true,
    description: 'Meme slug or ID',
  })
  async restore(
    @Param('slugOrId') slugOrId: string,
    @CurrentUser() user: User,
  ) {
    const meme = await this.memesService.restore(slugOrId, user);
    return {
      success: true,
      message: 'Meme restored successfully',
      data: meme,
    };
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Delete(':slugOrId/permanent')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({
    name: 'slugOrId',
    type: String,
    required: true,
    description: 'Meme slug or ID',
  })
  async hardDelete(
    @Param('slugOrId') slugOrId: string,
    @CurrentUser() user: User,
  ) {
    await this.memesService.hardDelete(slugOrId, user);
  }

  @ApiOkResponse({ description: 'Print ready file stream' })
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':slugOrId/print-ready')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'slugOrId',
    type: String,
    required: true,
    description: 'Meme slug or ID',
  })
  async printReady(
    @Param('slugOrId') slugOrId: string,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: User | null,
  ) {
    const fileResult = await this.memesService.getPrintReadyFile(
      slugOrId,
      user?.id,
    );
    if (!fileResult) {
      throw new NotFoundException('Print ready file not found');
    } else {
      res.redirect('/api/v1/files/' + fileResult);
    }
  }
}
