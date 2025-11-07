import { IsUUID } from 'class-validator';

export class MemeParamsDto {
  @IsUUID()
  memeId: string;
}
