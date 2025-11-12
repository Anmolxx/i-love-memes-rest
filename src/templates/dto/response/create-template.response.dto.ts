import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Tag } from '../../../tags/domain/tag';

export class CreateTemplateResponseDto {
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

  @ApiPropertyOptional({
    type: String,
    example: 'A funny cat meme template used for testing',
  })
  description?: string | null;

  @ApiPropertyOptional({
    type: 'object',
    description: 'User who created the template',
    additionalProperties: true,
    example: { id: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae' },
  })
  author?: { id: string };

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Canvas configuration (Fabric.js JSON)',
    example: {
      background: '#ffffff',
      objects: [
        {
          type: 'rect',
          left: 100,
          top: 100,
          width: 200,
          height: 100,
          fill: 'red',
        },
        {
          type: 'text',
          left: 120,
          top: 130,
          text: 'Hello World',
          fontSize: 24,
        },
      ],
    },
  })
  config: Record<string, any>;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;

  @ApiPropertyOptional({ type: Date })
  deletedAt?: Date | null;

  @ApiProperty({
    type: [Tag],
    description: 'Tags associated with the template',
    required: false,
  })
  tags?: Tag[];
}
