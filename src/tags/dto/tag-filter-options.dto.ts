import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { BaseQueryDto } from '../../utils/dto/base-query.dto';
import { TagStatus } from '../tags.enum';

/**
 * Tag-specific sort fields enum
 * Defines all sortable fields for tag queries
 */
export enum TagSortField {
  NAME = 'name',
  NORMALIZED_NAME = 'normalizedName',
  SLUG = 'slug',
  CATEGORY = 'category',
  DESCRIPTION = 'description',
  USAGE_COUNT = 'usageCount',
  STATUS = 'status',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

/**
 * Tag-specific filter properties
 */
export interface ITagFilters {
  category?: string[];
  status?: TagStatus;
}

/**
 * Comprehensive tag query DTO
 * Extends BaseQueryDto with tag-specific filters
 * Provides: page, limit, search, tags, orderBy, order, category, and status
 */
export class TagQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({
    enum: TagSortField,
    description: 'Field to sort tags by',
    default: TagSortField.USAGE_COUNT,
  })
  @IsOptional()
  @IsEnum(TagSortField)
  @Type(() => String)
  orderBy?: TagSortField;

  @ApiPropertyOptional({
    description: 'Categories to filter tags',
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
  category?: string[];

  @ApiPropertyOptional({
    description: 'Tag status to filter',
    enum: TagStatus,
  })
  @IsOptional()
  @IsEnum(TagStatus)
  status?: TagStatus;
}
