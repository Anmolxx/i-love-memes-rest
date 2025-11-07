import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MemeListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @ApiPropertyOptional({ default: 10 })
  limit?: number;

  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'title'])
  @ApiPropertyOptional({
    enum: ['createdAt', 'updatedAt', 'title'],
    description: 'Field to sort by',
    example: 'createdAt',
  })
  orderBy?: 'createdAt' | 'updatedAt' | 'title';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    description: 'Sort direction',
    example: 'desc',
  })
  order?: 'asc' | 'desc';

  @IsOptional()
  @ApiPropertyOptional({
    type: String,
    description: 'Case-insensitive search on title',
    example: '',
  })
  search?: string;
}
