import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({ example: 'This is an updated comment!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(2000)
  content: string;
}
