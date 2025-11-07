import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
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
import { TemplateService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { createResponse } from '../utils/base-response';
import { CreateTemplateResponseDto } from './dto/response/create-template.response.dto';
import { TemplateUuidDto } from './dto/template-uuid.dto';
import { Template } from './domain/template';
import { PaginatedResponse } from '../utils/dto/pagination-response.dto';
import { GetTemplatesQueryDto } from './dto/get-all-template-query.dto';
import { API_PAGE_LIMIT } from '../constants/common.constant';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

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

    return createResponse('Templates fetched successfully', items, meta);
  }

  @Get(':templateId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Template })
  async getById(@Param() params: TemplateUuidDto) {
    const result = await this.templateService.getById(params.templateId);
    return createResponse('Template Fetched Successfully', result);
  }

  @Patch(':templateId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOkResponse({ type: Template })
  @HttpCode(HttpStatus.OK)
  async update(
    @Body() updateTemplateDto: UpdateTemplateDto,
    @Param() param: TemplateUuidDto,
    @CurrentUser() user: JwtPayloadType,
  ) {
    const result = await this.templateService.update(
      param.templateId,
      updateTemplateDto,
      user,
    );

    return createResponse('Template Updated Successfully', result);
  }

  @Delete(':templateId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param() param: TemplateUuidDto) {
    await this.templateService.delete(param.templateId);
  }
}
