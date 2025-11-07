import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'This is a great meme!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(2000)
  content: string;

  @ApiProperty({ example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae' })
  @IsUUID()
  @IsNotEmpty()
  memeId: string;

  @ApiPropertyOptional({ example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae' })
  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}
