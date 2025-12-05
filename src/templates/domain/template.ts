import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Tag } from '../../tags/domain/tag';
import { UserSummary } from 'src/users/domain/user-summary';
import { TemplateSummaryDto } from '../dto/template-summary.dto';

export class Template {
  @ApiProperty({
    type: String,
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
  })
  @Expose({
    groups: ['template_details'],
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
    type: () => UserSummary,
    description: 'User who created the template',
  })
  author?: UserSummary;

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
  @Expose({
    groups: ['template_details'],
  })
  config: Record<string, any>;

  @ApiProperty({ type: Date })
  @Expose({
    groups: ['template_details'],
  })
  createdAt: Date;

  @ApiProperty({ type: Date })
  @Expose({
    groups: ['template_details'],
  })
  updatedAt: Date;

  @ApiPropertyOptional({ type: Date })
  @Expose({
    groups: ['template_details'],
  })
  deletedAt?: Date | null;

  @ApiProperty({
    type: [Tag],
    description: 'Tags associated with the template',
    required: false,
  })
  tags?: Tag[];

  @ApiProperty({ type: () => TemplateSummaryDto, required: false })
  summary?: TemplateSummaryDto;
}
