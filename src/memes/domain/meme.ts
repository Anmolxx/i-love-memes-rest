import { ApiProperty } from '@nestjs/swagger';
import { FileType } from '../../files/domain/file';
import { MemeAudience } from '../memes.enum';

type TemplateType = any;

export class Meme {
  @ApiProperty({
    type: String,
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
  })
  id: string;

  @ApiProperty({
    type: String,
    example: 'funny-cat',
  })
  title: string;

  @ApiProperty({
    type: String,
    example: 'funny-cat-slug',
  })
  slug: string;

  @ApiProperty({
    type: String,
    example: 'A funny cat meme',
  })
  description?: string;

  @ApiProperty({ type: () => Object })
  template?: TemplateType | null;

  @ApiProperty({ type: () => FileType })
  file: FileType;

  @ApiProperty({ type: () => Object })
  author?: any;

  @ApiProperty({
    type: String,
    enum: MemeAudience,
  })
  audience: MemeAudience;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}
