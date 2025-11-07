import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { FileDto } from '../../files/dto/file.dto';
import { MemeAudience } from '../memes.enum';

export class CreateMemeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => value.trim())
  title: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  description?: string | null;

  @ApiPropertyOptional({ type: () => FileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FileDto)
  file?: FileDto;

  @ApiPropertyOptional({ enum: MemeAudience })
  @IsOptional()
  @IsEnum(MemeAudience)
  audience?: MemeAudience;
}
