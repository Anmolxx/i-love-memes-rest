import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { FileDto } from '../../files/dto/file.dto';
import { MemeAudience } from '../memes.enum';

export class UpdateMemeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  title?: string;

  @ApiProperty()
  @IsOptional()
  templateId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  description?: string | null;

  @ApiPropertyOptional({ type: () => FileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FileDto)
  file?: FileDto | null;

  @ApiPropertyOptional({ enum: MemeAudience })
  @IsOptional()
  @IsEnum(MemeAudience)
  audience?: MemeAudience;
}
