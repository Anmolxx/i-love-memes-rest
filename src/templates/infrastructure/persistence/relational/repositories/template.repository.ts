import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { JwtPayloadType } from '../../../../../auth/strategies/types/jwt-payload.type';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { PaginationMetaDto } from '../../../../../utils/dto/pagination-response.dto';
import {
  IFilterOptions,
  IPaginationOptions,
  ISearchOptions,
  ISortOptions,
} from '../../../../../utils/types/pagination-options';
import { Template } from '../../../../domain/template';
import { CreateTemplateDto } from '../../../../dto/create-template.dto';
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

  async getById(id: string): Promise<TemplateEntity | null> {
    return this.templateRepository.findOne({
      where: { id },
    });
  }

  async findBySlug(slug: string): Promise<TemplateEntity | null> {
    return this.templateRepository.findOne({
      where: { slug },
    });
  }

  async findManyWithPagination(
    options: IPaginationOptions &
      ISortOptions<TemplateEntity> &
      IFilterOptions<TemplateEntity> &
      ISearchOptions,
  ): Promise<{ items: TemplateEntity[]; meta: PaginationMetaDto }> {
    const { page, limit, orderBy, order, filter, search } = options;
    const tags = (options as any).tags as string[] | undefined;

    const qb: SelectQueryBuilder<TemplateEntity> =
      this.templateRepository.createQueryBuilder('template');

    // Load related tags and author
    qb.leftJoinAndSelect('template.tags', 'tag');
    qb.leftJoinAndSelect('template.author', 'author');

    qb.orderBy(`template.${String(orderBy)}`, order);

    // Filter by tags if provided
    if (tags && tags.length > 0) {
      qb.andWhere('tag.name IN (:...tagNames)', { tagNames: tags });
    }

    if (filter) {
      for (const [key, value] of Object.entries(filter)) {
        if (value) {
          qb.andWhere(`template.${key} ILIKE :${key}`, {
            [key]: `%${value}%`,
          });
        }
      }
    }

    if (search) {
      qb.andWhere(`template.title ILIKE :title`, {
        title: `%${search}%`,
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

  async getMemeCountByTemplateId(templateId: string): Promise<number> {
    const qb: SelectQueryBuilder<TemplateEntity> =
      this.templateRepository.createQueryBuilder('template');

    const result = await qb
      .leftJoin('template.memes', 'meme')
      .where('template.id = :templateId', { templateId })
      .select('COUNT(meme.id)', 'count')
      .getRawOne();

    return result?.count ? parseInt(result.count, 10) : 0;
  }
}
