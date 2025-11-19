import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, Validate } from 'class-validator';
import { ComparisonType, TimePeriod } from '../enums/stats.enum';
import { DateRangeValidator } from '../utils/validators.util';

export class TimeRangeDto {
  @ApiPropertyOptional({
    example: '2025-01-01T00:00:00Z',
    description: 'Start date in ISO 8601 format',
  })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2025-12-31T23:59:59Z',
    description: 'End date in ISO 8601 format',
  })
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @ApiPropertyOptional({
    enum: TimePeriod,
    default: TimePeriod.DAILY,
    description: 'Time period granularity',
  })
  @IsOptional()
  @IsEnum(TimePeriod)
  period?: TimePeriod = TimePeriod.DAILY;

  @Validate(DateRangeValidator)
  validate?: boolean;
}

export class TimeRangeResponseDto {
  @ApiProperty()
  startDate: string;

  @ApiProperty()
  endDate: string;

  @ApiProperty({ enum: TimePeriod })
  period?: TimePeriod;
}

export class ComparisonPeriodDto {
  @ApiProperty()
  startDate: string;

  @ApiProperty()
  endDate: string;

  @ApiProperty({ enum: ComparisonType })
  type: ComparisonType;
}
