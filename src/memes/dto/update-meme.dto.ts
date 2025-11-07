import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FileDto } from '../../files/dto/file.dto';
import { MemeAudience } from '../memes.enum';

export class UpdateMemeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  title?: string;

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
