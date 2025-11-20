import { Injectable } from '@nestjs/common';
import { NullableType } from '../utils/types/nullable.type';
import { FileType } from './domain/file';

import { FileRepository } from './infrastructure/persistence/file.repository';

@Injectable()
export class FilesService {
  constructor(private readonly fileRepository: FileRepository) {}

  findById(id: FileType['id']): Promise<NullableType<FileType>> {
    return this.fileRepository.findById(id);
  }

  findByIds(ids: FileType['id'][]): Promise<FileType[]> {
    return this.fileRepository.findByIds(ids);
  }

  updateStatus(id: FileType['id'], status: FileType['status']) {
    return this.fileRepository.updateStatus(id, status);
  }

  deleteById(id: FileType['id']) {
    return this.fileRepository.deleteById(id);
  }

  hardDelete(id: FileType['id']) {
    return this.fileRepository.hardDelete(id);
  }

  getFilePath(entity: FileType): Promise<NullableType<string>> {
    return this.fileRepository.getFilePath(entity);
  }
}
