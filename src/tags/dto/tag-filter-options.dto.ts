import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { TagStatus } from '../tags.enum';

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

export class TagFilterOptionsDto {
  @ApiPropertyOptional({
    description: 'Search term for tag name',
    type: String,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Categories to filter tags',
    type: [String],
  })
  @IsOptional()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Type(() => String)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((v) => v.trim()) : value,
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

export class TagSortOptionsDto {
  @ApiPropertyOptional({
    enum: TagSortField,
    description: 'Field to sort tags by',
  })
  @IsOptional()
  @IsEnum(TagSortField)
  orderBy?: TagSortField;

  @ApiPropertyOptional({
    enum: ['ASC', 'DESC'],
    description: 'Sort order',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC';
}
