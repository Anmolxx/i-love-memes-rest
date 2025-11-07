import { ApiProperty } from '@nestjs/swagger';
import { FileType } from '../../files/domain/file';
import { MemeAudience } from '../memes.enum';

export class MemeDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  title: string;

  @ApiProperty({ type: String })
  slug: string;

  @ApiProperty({ type: String, required: false })
  description?: string | null;

  @ApiProperty({ type: () => FileType })
  file: FileType;

  @ApiProperty({ enum: MemeAudience })
  audience: MemeAudience;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}
