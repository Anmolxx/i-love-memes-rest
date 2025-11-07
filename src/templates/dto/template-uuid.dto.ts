import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class TemplateUuidDto {
  @IsUUID()
  @ApiProperty()
  templateId: string;
}
