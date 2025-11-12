import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { FileType } from '../../../../domain/file';
import { FileStatus } from '../../../../file.enum';
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

    return entity;
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
}
