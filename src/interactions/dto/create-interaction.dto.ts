import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { InteractionType, ReportReason } from '../interactions.enum';

export class CreateInteractionDto {
  @ApiProperty({
    example: 'funny-cat-meme',
    description: 'Meme slug or UUID',
  })
  @IsString()
  @IsNotEmpty()
  memeId: string;

  @ApiProperty({ enum: InteractionType, example: InteractionType.UPVOTE })
  @IsEnum(InteractionType)
  @IsNotEmpty()
  type: InteractionType;

  @ApiPropertyOptional({ enum: ReportReason })
  @IsOptional()
  @IsEnum(ReportReason)
  reason?: ReportReason;

  @ApiPropertyOptional({
    example: 'This content violates community guidelines',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
