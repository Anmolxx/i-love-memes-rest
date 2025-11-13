import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';

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

export class MemeFilterOptionsDto {
  @ApiPropertyOptional({
    description: 'Search term for meme title/content',
    type: String,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Tags to filter memes',
    type: [String],
  })
  @IsOptional()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Type(() => String)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((v) => v.trim()) : value,
  )
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Template IDs to filter memes',
    type: [String],
  })
  @IsOptional()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Type(() => String)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((v) => v.trim()) : value,
  )
  templateIds?: string[];
}

export class MemeSortOptionsDto {
  @ApiPropertyOptional({
    enum: MemeSortField,
    description: 'Field to sort memes by',
  })
  @IsOptional()
  @IsEnum(MemeSortField)
  orderBy?: MemeSortField;

  @ApiPropertyOptional({
    enum: ['ASC', 'DESC'],
    description: 'Sort order',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC';
}

export function isMemeFilterOptionsDto(obj: any): obj is MemeFilterOptionsDto {
  return (
    obj &&
    (typeof obj.search === 'string' || obj.search === undefined) &&
    (Array.isArray(obj.tags) || obj.tags === undefined) &&
    (Array.isArray(obj.templateIds) || obj.templateIds === undefined)
  );
}
