import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class FileDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  id: string;

  path: string;
}
