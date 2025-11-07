import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Comment {
  @ApiProperty({
    type: String,
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
  })
  id: string;

  @ApiProperty({
    type: String,
    example: 'This is a great meme!',
  })
  content: string;

  @ApiProperty({ type: () => Object })
  meme: any;

  @ApiProperty({ type: () => Object })
  author: any;

  @ApiPropertyOptional({ type: () => Object })
  parentComment?: any | null;

  @ApiProperty({
    type: Number,
    example: 0,
  })
  replyCount: number;

  @ApiProperty({
    type: Number,
    example: 0,
  })
  depth: number;

  @ApiProperty({
    type: String,
    enum: ['ACTIVE', 'EDITED', 'DELETED', 'HIDDEN'],
    example: 'ACTIVE',
  })
  status: string;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;

  @ApiPropertyOptional({ type: Date })
  editedAt?: Date | null;

  @ApiPropertyOptional({ type: Date })
  deletedAt?: Date | null;
}
