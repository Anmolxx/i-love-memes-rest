import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class Tag {
  @ApiProperty({
    type: String,
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
  })
  @Expose({
    groups: ['tag_details'],
  })
  id: string;

  @ApiProperty({
    type: String,
    example: 'Funny Cat',
  })
  name: string;

  @ApiProperty({
    type: String,
    example: 'funny cat',
  })
  normalizedName: string;

  @ApiProperty({
    type: String,
    example: 'funny-cat',
  })
  slug: string;

  @ApiPropertyOptional({
    type: String,
    example: 'humor',
  })
  category?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Tags related to funny cat memes',
  })
  description?: string | null;

  @ApiProperty({
    type: Number,
    example: 150,
  })
  usageCount: number;

  @ApiProperty({
    type: String,
    enum: ['ACTIVE', 'PENDING', 'REJECTED', 'BLACKLISTED'],
    example: 'ACTIVE',
  })
  status: string;

  @ApiProperty({ type: Date })
  @Expose({
    groups: ['tag_details'],
  })
  createdAt: Date;

  @ApiProperty({ type: Date })
  @Expose({
    groups: ['tag_details'],
  })
  updatedAt: Date;

  @ApiPropertyOptional({ type: Date })
  @Expose({
    groups: ['tag_details'],
  })
  deletedAt?: Date | null;
}
