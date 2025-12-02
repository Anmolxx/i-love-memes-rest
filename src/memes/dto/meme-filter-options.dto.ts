import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  InteractionType,
  ReportReason,
} from 'src/interactions/interactions.enum';
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
  reported?: boolean;
  flagged?: boolean;
  interactionType?: InteractionType;
  reasons?: ReportReason[];
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
    type: () => Array<string>,
    isArray: true,
  })
  @IsOptional()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Type(() => Array<string>)
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
  templateIds?: Array<string>;

  @ApiPropertyOptional({
    description:
      'When true, return only memes that have at least one REPORT interaction. Admin-only filter.',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  reported?: boolean;

  @ApiPropertyOptional({
    description:
      'When true, return only memes that have at least one FLAG interaction. Admin-only filter.',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  flagged?: boolean;

  @ApiPropertyOptional({
    description:
      'Filter memes by interaction type (e.g. REPORT or FLAG). Admin-only filter.',
    enum: InteractionType,
  })
  @IsOptional()
  @IsEnum(InteractionType)
  @Type(() => String)
  interactionType?: InteractionType;

  @ApiPropertyOptional({
    description:
      'Filter memes by report reasons (comma separated or array). Implies type=REPORT when provided. Admin-only filter.',
    enum: ReportReason,
    isArray: true,
  })
  @IsOptional()
  @ArrayNotEmpty()
  @IsEnum(ReportReason, { each: true })
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
  reasons?: ReportReason[];
}
