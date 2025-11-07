import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TagStatus } from '../tags.enum';

export class CreateTagDto {
  @ApiProperty({ example: 'Funny Cat' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ example: 'humor' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ApiPropertyOptional({ example: 'Tags related to funny cat memes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    enum: TagStatus,
    example: TagStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(TagStatus)
  status?: TagStatus;
}
