import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { BaseQueryDto } from '../../utils/dto/base-query.dto';

/**
 * Meme-specific sort fields enum
 * Defines all sortable fields for meme queries
 */
export enum MemeSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TITLE = 'title',
  UPVOTES = 'upvotes',
  DOWNVOTES = 'downvotes',
  REPORTS = 'reports',
  TRENDING = 'trending',
  SCORE = 'score',
}

/**
 * Meme-specific filter properties
 */
export interface IMemeFilters {
  templateIds?: string[];
}

/**
 * Comprehensive meme query DTO
 * Extends BaseQueryDto with meme-specific filters
 * Provides: page, limit, search, tags, orderBy, order, and templateIds
 */
export class MemeQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({
    enum: MemeSortField,
    description: 'Field to sort memes by',
    default: MemeSortField.TRENDING,
  })
  @IsOptional()
  @IsEnum(MemeSortField)
  @Type(() => String)
  orderBy?: MemeSortField;

  @ApiPropertyOptional({
    description: 'Template IDs to filter memes',
    type: [String],
    isArray: true,
  })
  @IsOptional()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Type(() => String)
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)
      : Array.isArray(value)
        ? value.map((v) => String(v).trim()).filter(Boolean)
        : value,
  )
  templateIds?: string[];
}
