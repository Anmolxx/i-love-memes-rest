import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tag } from 'src/tags/domain/tag';
import { ITagFilters, TagSortField } from 'src/tags/dto/tag-filter-options.dto';
import { PaginationMetaDto } from 'src/utils/dto/pagination-response.dto';
import { NullableType } from 'src/utils/types/nullable.type';
import {
  IFilterOptions,
  IPaginationOptions,
  ISortOptions,
} from 'src/utils/types/pagination-options';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { MemeTagEntity } from '../entities/meme-tag.entity';

import { TagEntity } from '../entities/tag.entity';
import { TemplateTagEntity } from '../entities/template-tag.entity';
import { TagMapper } from '../mapper/tag.mapper';
import { TagRepository } from './tag.repository';

@Injectable()
export class TagRelationalRepository implements TagRepository {
  constructor(
    @InjectRepository(TagEntity)
    private readonly tagRepository: Repository<TagEntity>,
    @InjectRepository(MemeTagEntity)
    private readonly memeTagRepository: Repository<MemeTagEntity>,
    @InjectRepository(TemplateTagEntity)
    private readonly templateTagRepository: Repository<TemplateTagEntity>,
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
    filterOptions?: IFilterOptions<ITagFilters> | null;
    sortOptions?: ISortOptions<TagSortField> | null;
    paginationOptions: IPaginationOptions;
  }): Promise<{ items: Tag[]; meta: PaginationMetaDto }> {
    const qb = this.tagRepository.createQueryBuilder('tag');

    // Apply filters at DB level
    this.applyFilters(qb, filterOptions);

    // Apply sorting at DB level
    this.applySorting(qb, sortOptions);

    // Apply pagination
    qb.skip((paginationOptions.page - 1) * paginationOptions.limit).take(
      paginationOptions.limit,
    );

    // Execute query
    const [entities, total] = await qb.getManyAndCount();

    // Map to domain
    const items = entities.map((entity) => TagMapper.toDomain(entity));

    const meta: PaginationMetaDto = {
      totalItems: total,
      totalPages: Math.ceil(total / paginationOptions.limit) || 1,
      currentPage: paginationOptions.page,
      limit: paginationOptions.limit,
    };

    return { items, meta };
  }

  /**
   * Apply filters to query builder - matching memes pattern
   */
  private applyFilters(
    qb: SelectQueryBuilder<TagEntity>,
    filterOptions?: IFilterOptions<ITagFilters> | null,
  ): void {
    // Always filter out soft-deleted records
    qb.andWhere('tag.deletedAt IS NULL');

    if (filterOptions?.search) {
      qb.andWhere(
        '(tag.name ILIKE :search OR tag.normalizedName ILIKE :search)',
        {
          search: `%${filterOptions.search}%`,
        },
      );
    }

    if (filterOptions?.category && filterOptions.category.length > 0) {
      qb.andWhere('tag.category IN (:...categories)', {
        categories: filterOptions.category,
      });
    }

    if (filterOptions?.status) {
      qb.andWhere('tag.status = :status', { status: filterOptions.status });
    }
  }

  /**
   * Apply sorting to query builder - matching memes pattern
   */
  private applySorting(
    qb: SelectQueryBuilder<TagEntity>,
    sortOptions?: ISortOptions<TagSortField> | null,
  ): void {
    const orderBy = sortOptions?.orderBy || TagSortField.CREATED_AT;
    const order = sortOptions?.order || 'DESC';

    // Map enum to actual column names
    const columnMap: Record<TagSortField, string> = {
      [TagSortField.NAME]: 'tag.name',
      [TagSortField.NORMALIZED_NAME]: 'tag.normalizedName',
      [TagSortField.SLUG]: 'tag.slug',
      [TagSortField.CATEGORY]: 'tag.category',
      [TagSortField.DESCRIPTION]: 'tag.description',
      [TagSortField.USAGE_COUNT]: 'tag.usageCount',
      [TagSortField.STATUS]: 'tag.status',
      [TagSortField.CREATED_AT]: 'tag.createdAt',
      [TagSortField.UPDATED_AT]: 'tag.updatedAt',
    };

    const column = columnMap[orderBy] || 'tag.createdAt';
    qb.orderBy(column, order);
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

  async findDeletedWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: IFilterOptions<ITagFilters> | null;
    sortOptions?: ISortOptions<TagSortField> | null;
    paginationOptions: IPaginationOptions;
  }): Promise<{ items: Tag[]; meta: PaginationMetaDto }> {
    const qb = this.tagRepository.createQueryBuilder('tag');

    qb.withDeleted();
    qb.andWhere('tag.deletedAt IS NOT NULL');

    this.applyFilters(qb, filterOptions);
    this.applySorting(qb, sortOptions);

    qb.skip((paginationOptions.page - 1) * paginationOptions.limit).take(
      paginationOptions.limit,
    );

    const [entities, total] = await qb.getManyAndCount();

    const items = entities.map((entity) => TagMapper.toDomain(entity));

    const meta: PaginationMetaDto = {
      totalItems: total,
      totalPages: Math.ceil(total / paginationOptions.limit) || 1,
      currentPage: paginationOptions.page,
      limit: paginationOptions.limit,
    };

    return { items, meta };
  }

  async restore(id: Tag['id']): Promise<void> {
    await this.tagRepository.restore(id);
  }

  async hardDelete(id: Tag['id']): Promise<void> {
    await this.tagRepository.delete(id);
  }

  async incrementUsageCount(id: Tag['id']): Promise<void> {
    await this.tagRepository.increment({ id }, 'usageCount', 1);
  }

  async decrementUsageCount(id: Tag['id']): Promise<void> {
    await this.tagRepository.decrement({ id }, 'usageCount', 1);
  }

  async linkTagToMeme(memeId: string, tagId: string): Promise<void> {
    const memeTag = this.memeTagRepository.create({
      meme: { id: memeId } as any,
      tag: { id: tagId } as any,
    });
    await this.memeTagRepository.save(memeTag);
  }

  async linkTagToTemplate(templateId: string, tagId: string): Promise<void> {
    const templateTag = this.templateTagRepository.create({
      template: { id: templateId } as any,
      tag: { id: tagId } as any,
    });
    await this.templateTagRepository.save(templateTag);
  }

  async removeAllTagLinksForMeme(memeId: string): Promise<void> {
    await this.memeTagRepository.delete({ meme: { id: memeId } });
  }

  async removeAllTagLinksForTemplate(templateId: string): Promise<void> {
    await this.templateTagRepository.delete({ template: { id: templateId } });
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
