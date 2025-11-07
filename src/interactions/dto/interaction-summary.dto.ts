import { ApiProperty } from '@nestjs/swagger';

export class InteractionSummaryDto {
  @ApiProperty({ example: 150 })
  upvoteCount: number;

  @ApiProperty({ example: 10 })
  downvoteCount: number;

  @ApiProperty({ example: 2 })
  reportCount: number;

  @ApiProperty({ example: 5 })
  flagCount: number;

  @ApiProperty({ example: 140 })
  netScore: number;

  @ApiProperty({ required: false })
  userInteraction?: {
    type: string;
    createdAt: Date;
  };
}
