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
import { Template } from './domain/template';
import { CreateTemplateDto } from './dto/create-template.dto';
import { GetTemplatesQueryDto } from './dto/get-all-template-query.dto';
import { CreateTemplateResponseDto } from './dto/response/create-template.response.dto';
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
  async getAll(@Query() query: GetTemplatesQueryDto) {
    const {
      page = 1,
      limit = 10,
      orderBy = 'createdAt',
      order = 'DESC',
      search,
    } = query;
    const effectiveLimit = Math.min(limit, API_PAGE_LIMIT);

    const options = {
      paginationOptions: { page, limit: effectiveLimit },
      sortOptions: { orderBy, order },
      search,
    };

    const { items, meta } = await this.templateService.getAll(options);

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
