import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { BaseQueryDto } from '../../utils/dto/base-query.dto';

/**
 * Template-specific sort fields enum
 * Defines all sortable fields for template queries
 */
export enum TemplateSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TITLE = 'title',
}

/**
 * Template-specific filter properties
 * (Currently empty - templates only use common filters: search, tags)
 */
export type ITemplateFilters = Record<string, never>;

/**
 * Comprehensive template query DTO
 * Extends BaseQueryDto with template-specific filters
 * Provides: page, limit, search, tags, orderBy, order
 */
export class TemplateQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({
    enum: TemplateSortField,
    description: 'Field to sort templates by',
    default: TemplateSortField.CREATED_AT,
    example: TemplateSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(TemplateSortField)
  @Type(() => String)
  orderBy?: TemplateSortField;
}
