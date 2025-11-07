import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { TagStatus } from '../tags.enum';

class FilterTagDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Type(() => String)
  category?: string[] | null;

  @ApiPropertyOptional({ enum: TagStatus })
  @IsOptional()
  @IsEnum(TagStatus)
  status?: TagStatus | null;
}

class SortTagDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  orderBy?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  order?: string;
}

export class QueryTagDto {
  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @Type(() => FilterTagDto)
  @ValidateNested()
  filters?: FilterTagDto | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @Type(() => SortTagDto)
  @ValidateNested({ each: true })
  sort?: SortTagDto[] | null;
}
