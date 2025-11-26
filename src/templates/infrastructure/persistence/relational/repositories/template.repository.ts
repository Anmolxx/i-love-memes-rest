import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtPayloadType } from 'src/auth/strategies/types/jwt-payload.type';
import { UserEntity } from 'src/users/infrastructure/persistence/relational/entities/user.entity';
import { IFilterOptions, IPaginationOptions, ISortOptions } from 'src/utils';
import { PaginationMetaDto } from 'src/utils/dto/pagination-response.dto';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Template } from '../../../../domain/template';
import { CreateTemplateDto } from '../../../../dto/create-template.dto';
import {
  ITemplateFilters,
  TemplateSortField,
} from '../../../../dto/template-filter-options.dto';
import { TemplateRepository } from '../../template.repository';
import { TemplateEntity } from '../entities/template.entity';

@Injectable()
export class TemplateRelationalRepository implements TemplateRepository {
  constructor(
    @InjectRepository(TemplateEntity)
    private readonly templateRepository: Repository<TemplateEntity>,
  ) {}

  async create(
    createTemplateDto: CreateTemplateDto,
    user: JwtPayloadType,
    slug: string,
  ): Promise<TemplateEntity> {
    const template = this.templateRepository.create({
      title: createTemplateDto.title,
      description: createTemplateDto.description ?? undefined,
      config: createTemplateDto.config,
      slug: slug,
      author: { id: user.id } as UserEntity,
    });

    return this.templateRepository.save(template);
  }

  async getByTitle(title: string): Promise<TemplateEntity | null> {
    return this.templateRepository.findOne({
      where: { title },
    });
  }

  async getById(
    id: string,
    withDeleted: boolean = false,
  ): Promise<TemplateEntity | null> {
    return this.templateRepository.findOne({
      where: { id },
      withDeleted,
    });
  }

  async findBySlug(
    slug: string,
    withDeleted: boolean = false,
  ): Promise<TemplateEntity | null> {
    return this.templateRepository.findOne({
      where: { slug },
      withDeleted,
    });
  }

  async findManyWithPagination(options: {
    paginationOptions: IPaginationOptions;
    sortOptions?: ISortOptions<TemplateSortField>;
    filterOptions?: IFilterOptions<ITemplateFilters> | null;
  }): Promise<{ items: TemplateEntity[]; meta: PaginationMetaDto }> {
    const { paginationOptions, sortOptions, filterOptions } = options;
    const { page, limit } = paginationOptions;

    const qb: SelectQueryBuilder<TemplateEntity> =
      this.templateRepository.createQueryBuilder('template');

    // Load related tags and author
    qb.leftJoinAndSelect('template.tags', 'tag');
    qb.leftJoinAndSelect('template.author', 'author');

    // Apply sorting
    if (sortOptions?.orderBy) {
      qb.orderBy(
        `template.${sortOptions.orderBy}`,
        sortOptions.order ?? 'DESC',
      );
    } else {
      qb.orderBy('template.createdAt', 'DESC');
    }

    // Filter by search
    if (filterOptions?.search) {
      qb.andWhere('template.title ILIKE :title', {
        title: `%${filterOptions.search}%`,
      });
    }

    // Filter by tags if provided
    if (filterOptions?.tags && filterOptions.tags.length > 0) {
      qb.andWhere('tag.name IN (:...tagNames)', {
        tagNames: filterOptions.tags,
      });
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    const meta: PaginationMetaDto = {
      totalItems: total,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
      limit,
    };

    return {
      items: data,
      meta,
    };
  }

  async update(
    updateData: Partial<TemplateEntity>,
    id: string,
  ): Promise<TemplateEntity> {
    const template = await this.templateRepository.preload({
      id,
      ...updateData,
    });

    if (!template) {
      throw new NotFoundException('Template not found with given ID');
    }

    return this.templateRepository.save(template);
  }

  async softDelete(id: Template['id']) {
    await this.templateRepository.softDelete(id);
  }

  async findDeletedWithPagination(options: {
    paginationOptions: IPaginationOptions;
    sortOptions?: ISortOptions<TemplateSortField>;
    filterOptions?: IFilterOptions<ITemplateFilters> | null;
  }): Promise<{ items: TemplateEntity[]; meta: PaginationMetaDto }> {
    const { paginationOptions, sortOptions, filterOptions } = options;
    const { page, limit } = paginationOptions;

    const qb: SelectQueryBuilder<TemplateEntity> =
      this.templateRepository.createQueryBuilder('template');

    qb.withDeleted();
    qb.andWhere('template.deletedAt IS NOT NULL');

    // Load related tags and author
    qb.leftJoinAndSelect('template.tags', 'tag');
    qb.leftJoinAndSelect('template.author', 'author');

    // Apply sorting
    if (sortOptions?.orderBy) {
      qb.orderBy(
        `template.${sortOptions.orderBy}`,
        sortOptions.order ?? 'DESC',
      );
    } else {
      qb.orderBy('template.createdAt', 'DESC');
    }

    // Filter by search
    if (filterOptions?.search) {
      qb.andWhere('template.title ILIKE :title', {
        title: `%${filterOptions.search}%`,
      });
    }

    // Filter by tags if provided
    if (filterOptions?.tags && filterOptions.tags.length > 0) {
      qb.andWhere('tag.name IN (:...tagNames)', {
        tagNames: filterOptions.tags,
      });
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    const meta: PaginationMetaDto = {
      totalItems: total,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
      limit,
    };

    return {
      items: data,
      meta,
    };
  }

  async restore(id: Template['id']): Promise<void> {
    await this.templateRepository.restore(id);
  }

  async hardDelete(id: Template['id']): Promise<void> {
    await this.templateRepository.delete(id);
  }

  async getMemeCountByTemplateId(templateId: string): Promise<number> {
    const qb: SelectQueryBuilder<TemplateEntity> =
      this.templateRepository.createQueryBuilder('template');

    const result = await qb
      .leftJoin('template.memes', 'meme')
      .where('template.id = :templateId', { templateId })
      .andWhere('meme.deletedAt IS NULL')
      .select('COUNT(meme.id)', 'count')
      .getRawOne();

    return result?.count ? parseInt(result.count, 10) : 0;
  }
}
