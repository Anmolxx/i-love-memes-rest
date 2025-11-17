import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';

export enum TemplateSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TITLE = 'title',
}

export class TemplateFilterDto {
  @ApiPropertyOptional({
    description: 'Search term for template title/description',
    type: String,
    example: 'funny',
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
}

export class SortTemplateDto {
  @ApiPropertyOptional({
    enum: TemplateSortField,
    description: 'Field to sort templates by',
    example: TemplateSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(TemplateSortField)
  orderBy?: TemplateSortField;

  @ApiPropertyOptional({
    enum: ['ASC', 'DESC'],
    description: 'Sort order',
    example: 'DESC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC';
}
