import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class FindOrCreateTagsDto {
  @ApiProperty({ example: ['funny', 'cat', 'meme'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  names: string[];
}
