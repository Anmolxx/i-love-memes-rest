import { NullableType } from '../../../utils/types/nullable.type';
import { FileType } from '../../domain/file';
import { FileStatus } from '../../file.enum';

export abstract class FileRepository {
  abstract create(data: Omit<FileType, 'id'>): Promise<FileType>;

  abstract findById(id: FileType['id']): Promise<NullableType<FileType>>;

  abstract findByIds(ids: FileType['id'][]): Promise<FileType[]>;

  abstract updateStatus(
    id: FileType['id'],
    status: FileStatus,
  ): Promise<FileType | null>;

  abstract deleteById(id: FileType['id']): Promise<null>;

  abstract findManyWithPagination(
    page: number,
    limit: number,
  ): Promise<{ items: FileType[]; totalItems: number }>;
}
