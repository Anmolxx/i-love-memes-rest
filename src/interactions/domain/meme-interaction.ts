import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MemeInteraction {
  @ApiProperty({
    type: String,
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
  })
  id: string;

  @ApiProperty({ type: () => Object })
  meme: any;

  @ApiProperty({ type: () => Object })
  user: any;

  @ApiProperty({
    type: String,
    enum: ['UPVOTE', 'DOWNVOTE', 'REPORT', 'FLAG'],
    example: 'UPVOTE',
  })
  type: string;

  @ApiPropertyOptional({
    type: String,
    enum: [
      'SPAM',
      'INAPPROPRIATE',
      'COPYRIGHT',
      'NSFW',
      'HARASSMENT',
      'VIOLENCE',
      'OTHER',
    ],
  })
  reason?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'This content violates community guidelines',
  })
  note?: string | null;

  @ApiProperty({ type: Date })
  createdAt: Date;
}
