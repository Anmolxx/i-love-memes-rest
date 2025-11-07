import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Pagination metadata DTO
 */
export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  currentPage: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 100 })
  totalItems: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

/**
 * Generic paginated response wrapper
 * Example usage:
 *   @ApiOkResponse({ type: PaginatedResponse(UserDto) })
 */
export function PaginatedResponse<T>(classRef: Type<T>) {
  class PaginatedDataDto {
    @ApiProperty({ type: [classRef] })
    data: T[];

    @ApiProperty({ type: PaginationMetaDto })
    meta: PaginationMetaDto;
  }

  Object.defineProperty(PaginatedDataDto, 'name', {
    writable: false,
    value: `Pagination${classRef.name}ResponseDto`,
  });

  return PaginatedDataDto;
}
