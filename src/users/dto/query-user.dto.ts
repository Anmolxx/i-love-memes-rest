import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum UserSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  EMAIL = 'email',
}

export class FilterUserDto {
  @ApiPropertyOptional({
    description: 'Filter by first name (partial match)',
    type: String,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Filter by last name (partial match)',
    type: String,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Filter by email (partial match)',
    type: String,
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Filter by status ID',
    type: Number,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  status?: number;

  @ApiPropertyOptional({
    description: 'Filter by role ID',
    type: Number,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  role?: number;
}

export class SortUserDto {
  @ApiPropertyOptional({
    enum: UserSortField,
    description: 'Field to sort users by',
  })
  @IsOptional()
  @IsEnum(UserSortField)
  orderBy?: UserSortField;

  @ApiPropertyOptional({
    enum: ['ASC', 'DESC'],
    description: 'Sort order',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC';
}
