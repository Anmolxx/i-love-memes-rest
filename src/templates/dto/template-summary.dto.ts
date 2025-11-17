import { ApiProperty } from '@nestjs/swagger';

export class TemplateSummaryDto {
  @ApiProperty({
    type: Number,
    description: 'Number of memes created using this template',
    example: 42,
  })
  totalMemes: number;
}
