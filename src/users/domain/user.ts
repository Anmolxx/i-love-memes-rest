import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { FileType } from '../../files/domain/file';
import { Role } from '../../roles/domain/role';
import { Status } from '../../statuses/domain/status';

const idType = Number;

export class User {
  @ApiProperty({
    type: idType,
  })
  @Expose({
    groups: ['me', 'admin', 'comments', 'meme_details', 'template_details'],
  })
  id: string;

  @ApiProperty({
    type: String,
    example: 'john.doe@example.com',
  })
  email: string | null;

  @Exclude({ toPlainOnly: true })
  password?: string;

  @ApiProperty({
    type: String,
    example: 'email',
  })
  @Expose({ groups: ['me', 'admin'] })
  provider: string;

  @ApiProperty({
    type: String,
    example: '1234567890',
  })
  @Expose({ groups: ['me', 'admin'] })
  socialId?: string | null;

  @ApiProperty({
    type: String,
    example: 'John',
  })
  firstName: string | null;

  @ApiProperty({
    type: String,
    example: 'Doe',
  })
  lastName: string | null;

  @ApiProperty({
    type: () => FileType,
  })
  photo?: FileType | null;

  @ApiProperty({
    type: () => Role,
  })
  @Expose({ groups: ['me', 'admin'] })
  role?: Role | null;

  @ApiProperty({
    type: () => Status,
  })
  @Expose({ groups: ['me', 'admin'] })
  status?: Status;

  @ApiProperty()
  @Expose({ groups: ['me', 'admin'] })
  createdAt: Date;

  @ApiProperty()
  @Expose({ groups: ['me', 'admin'] })
  updatedAt: Date;

  @ApiProperty()
  @Expose({ groups: ['me', 'admin'] })
  deletedAt: Date;
}
