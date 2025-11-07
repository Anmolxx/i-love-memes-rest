import { PaginationMetaDto } from './dto/pagination-response.dto';

export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMetaDto;
}

export const createResponse = <T>(
  message = 'Request successful',
  data: T,
  meta?: PaginationMetaDto,
) => ({
  data,
  ...(meta ? { meta } : {}),
  success: true,
  message,
});
