import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTemplateDto {
  @ApiProperty({
    example: 'Business Card Template',
    description: 'Title of the template',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => value.trim())
  title: string;

  @ApiPropertyOptional({
    example: 'A minimal business card layout',
    description: 'Optional short description for the template',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  description?: string | null;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: {
      background: '#ffffff',
      objects: [
        {
          type: 'rect',
          left: 10,
          top: 10,
          width: 100,
          height: 50,
          fill: 'blue',
        },
        { type: 'text', left: 30, top: 30, text: 'Hello', fontSize: 20 },
      ],
    },
    description: 'Fabric.js configuration or template JSON',
  })
  @IsNotEmpty()
  @IsObject()
  config: Record<string, any>;

  @ApiPropertyOptional({ type: [String], description: 'Tags for the template' })
  @IsOptional()
  tags?: string[];
}
