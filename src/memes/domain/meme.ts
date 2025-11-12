import { ApiProperty } from '@nestjs/swagger';
import { Template } from 'src/templates/domain/template';
import { User } from 'src/users/domain/user';
import { FileType } from '../../files/domain/file';
import { MemeAudience } from '../memes.enum';
import { Tag } from '../../tags/domain/tag';

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

  @ApiProperty({ type: () => Template })
  template?: Partial<Template> | null;

  @ApiProperty({ type: () => FileType })
  file: FileType;

  @ApiProperty({ type: () => User })
  author?: Partial<User> | null;

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

  @ApiProperty({
    type: [Tag],
    description: 'Tags associated with the meme',
    required: false,
  })
  tags?: Tag[];
}
