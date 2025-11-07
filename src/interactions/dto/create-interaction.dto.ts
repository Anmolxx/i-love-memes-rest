import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { InteractionType, ReportReason } from '../interactions.enum';

export class CreateInteractionDto {
  @ApiProperty({ example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae' })
  @IsUUID()
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
