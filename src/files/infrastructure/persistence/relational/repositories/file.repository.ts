import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FileType } from 'src/files/domain/file';
import { FileStatus } from 'src/files/file.enum';
import { NullableType } from 'src/utils/types/nullable.type';
import { In, Repository } from 'typeorm';
import { FileRepository } from '../../file.repository';
import { FileEntity } from '../entities/file.entity';

import { FileMapper } from '../mappers/file.mapper';

@Injectable()
export class FileRelationalRepository implements FileRepository {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
  ) {}

  async create(data: FileType): Promise<FileType> {
    const persistenceModel = FileMapper.toPersistence(data);
    const entity = await this.fileRepository.save(
      this.fileRepository.create(persistenceModel),
    );

    return FileMapper.toDomain(entity);
  }

  async findById(id: FileType['id']): Promise<NullableType<FileType>> {
    const entity = await this.fileRepository.findOne({
      where: {
        id: id,
      },
    });

    return entity ? FileMapper.toDomain(entity) : null;
  }

  async findByIds(ids: FileType['id'][]): Promise<FileType[]> {
    const entities = await this.fileRepository.find({
      where: {
        id: In(ids),
      },
    });

    return entities.map((entity) => FileMapper.toDomain(entity));
  }

  async updateStatus(
    id: FileType['id'],
    status: FileStatus,
  ): Promise<FileType | null> {
    await this.fileRepository.update(id, { status });

    const updatedEntity = await this.fileRepository.findOne({
      where: { id },
    });

    return updatedEntity ? FileMapper.toDomain(updatedEntity) : null;
  }

  async deleteById(id: FileType['id']): Promise<null> {
    await this.fileRepository.delete(id);
    return null;
  }

  async findManyWithPagination(
    page: number,
    limit: number,
  ): Promise<{ items: FileType[]; totalItems: number }> {
    const [entities, totalItems] = await this.fileRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      items: entities.map(FileMapper.toDomain),
      totalItems,
    };
  }

  // Permanently remove file record and delete underlying file from storage if present
  async hardDelete(id: FileType['id']): Promise<void> {
    const entity = await this.fileRepository.findOne({ where: { id } });
    if (!entity) return;

    const filePath = entity.path;
    // Attempt to remove the file from disk; ignore errors related to missing file
    if (filePath) {
      try {
        // Resolve relative paths against project root
        const resolved = path.isAbsolute(filePath)
          ? filePath
          : path.resolve(process.cwd(), filePath);
        await fs.unlink(resolved);
      } catch (err) {
        // ignore errors for now (file might already be removed)
        console.error(
          `Something went wrong while deleting file ${filePath}:`,
          err,
        );
      }
    }

    await this.fileRepository.delete(id);
  }

  getFilePath(entity: FileType) {
    let resolved: string;

    resolved = entity.path;
    if (path.isAbsolute(entity.path) && /^\/api(?:\/|$)/.test(entity.path)) {
      resolved = entity.path;
      if (/^\/api(?:\/|$)/.test(entity.path)) {
        resolved = resolved.split('/').reverse()[0];
      }

      // resolved = path.resolve(process.cwd(), 'files', apiPath);
    }

    return Promise.resolve(resolved);
  }
}
