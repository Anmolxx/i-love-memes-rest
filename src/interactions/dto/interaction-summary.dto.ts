import { ApiProperty } from '@nestjs/swagger';
import { ReportReason } from 'src/interactions/interactions.enum';

export class UserInteractionDto {
  @ApiProperty({
    example: 'UPVOTE',
    enum: ['UPVOTE', 'DOWNVOTE', 'REPORT', 'FLAG'],
  })
  type: string;

  @ApiProperty({ example: '2025-11-14T12:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: 'Inappropriate content', required: false })
  reason?: ReportReason;

  @ApiProperty({ example: 'Spam content', required: false })
  note?: string;
}

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

  @ApiProperty({
    type: [UserInteractionDto],
    required: false,
    description: 'User-specific interactions for this meme',
  })
  userInteractions?: UserInteractionDto[];
}
