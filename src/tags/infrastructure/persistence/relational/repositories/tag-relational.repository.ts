import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NullableType } from 'src/utils/types/nullable.type';
import { IPaginationOptions } from 'src/utils/types/pagination-options';
import { In, Repository } from 'typeorm';

import { TagEntity } from '../entities/tag.entity';
import { TagMapper } from '../mapper/tag.mapper';
import { TagRepository } from './tag.repository';
import { Tag } from 'src/tags/domain/tag';

@Injectable()
export class TagRelationalRepository implements TagRepository {
  constructor(
    @InjectRepository(TagEntity)
    private readonly tagRepository: Repository<TagEntity>,
  ) {}

  async create(
    data: Omit<Tag, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Tag> {
    const persistenceModel = TagMapper.toPersistence(data as Tag);
    const newEntity = await this.tagRepository.save(
      this.tagRepository.create(persistenceModel),
    );
    return TagMapper.toDomain(newEntity);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: any | null;
    sortOptions?: Array<any> | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Tag[]> {
    const where: any = {};
    if (filterOptions?.category) {
      where.category = In(filterOptions.category);
    }
    if (filterOptions?.status) {
      where.status = filterOptions.status;
    }

    const entities = await this.tagRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where,
      order: sortOptions?.reduce(
        (accumulator, sort) => ({
          ...accumulator,
          [sort.orderBy]: sort.order,
        }),
        {},
      ),
    });

    return entities.map((entity) => TagMapper.toDomain(entity));
  }

  async findById(id: Tag['id']): Promise<NullableType<Tag>> {
    const entity = await this.tagRepository.findOne({
      where: { id },
    });

    return entity ? TagMapper.toDomain(entity) : null;
  }

  async findByNormalizedName(
    normalizedName: string,
  ): Promise<NullableType<Tag>> {
    const entity = await this.tagRepository.findOne({
      where: { normalizedName },
    });

    return entity ? TagMapper.toDomain(entity) : null;
  }

  async findBySlug(slug: string): Promise<NullableType<Tag>> {
    const entity = await this.tagRepository.findOne({
      where: { slug },
    });

    return entity ? TagMapper.toDomain(entity) : null;
  }

  async findByNames(names: string[]): Promise<Tag[]> {
    const normalizedNames = names.map(
      (name) => this.normalizeTagName(name).normalized,
    );

    const entities = await this.tagRepository.find({
      where: { normalizedName: In(normalizedNames) },
    });

    return entities.map((entity) => TagMapper.toDomain(entity));
  }

  async update(id: Tag['id'], payload: Partial<Tag>): Promise<Tag | null> {
    const entity = await this.tagRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    const updatedEntity = await this.tagRepository.save(
      this.tagRepository.create(
        TagMapper.toPersistence({
          ...TagMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return TagMapper.toDomain(updatedEntity);
  }

  async remove(id: Tag['id']): Promise<void> {
    await this.tagRepository.softDelete(id);
  }

  async incrementUsageCount(id: Tag['id']): Promise<void> {
    await this.tagRepository.increment({ id }, 'usageCount', 1);
  }

  async decrementUsageCount(id: Tag['id']): Promise<void> {
    await this.tagRepository.decrement({ id }, 'usageCount', 1);
  }

  private normalizeTagName(name: string): {
    normalized: string;
    slug: string;
  } {
    const normalized = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^-+|-+$/g, '')
      .trim();

    const slug = normalized.replace(/\s+/g, '-');

    return { normalized, slug };
  }
}
