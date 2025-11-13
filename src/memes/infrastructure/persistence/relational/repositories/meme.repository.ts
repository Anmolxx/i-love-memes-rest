import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  isMemeFilterOptionsDto,
  MemeFilterOptionsDto,
  MemeSortField,
  MemeSortOptionsDto,
} from 'src/memes/dto/meme-filter-options.dto';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { PaginationMetaDto } from '../../../../../utils/dto/pagination-response.dto';
import { Meme } from '../../../../domain/meme';
import { MemeAudience } from '../../../../memes.enum';
import { MemesRepository } from '../../meme.repository';
import { MemeEntity } from '../entities/meme.entity';
import { MemeMapper } from '../mapper/meme.mapper';

@Injectable()
export class MemesRelationalRepository implements MemesRepository {
  constructor(
    @InjectRepository(MemeEntity)
    private readonly memesRepository: Repository<MemeEntity>,
  ) {}

  async create(data: Meme): Promise<Meme> {
    const persistenceModel = MemeMapper.toPersistence(data as Meme);
    const newEntity = await this.memesRepository.save(
      this.memesRepository.create(persistenceModel),
    );
    return MemeMapper.toDomain(newEntity);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: MemeFilterOptionsDto | null;
    sortOptions?: MemeSortOptionsDto;
    paginationOptions: { page: number; limit: number };
  }): Promise<{ items: Meme[]; meta: PaginationMetaDto }> {
    const qb = this.memesRepository.createQueryBuilder('meme');

    // Use the shared helper and enforce public audience for the general listing
    this.applyCommonQueryOptions(qb, {
      filterOptions,
      sortOptions,
      enforceAudiencePublic: true,
    });

    qb.skip((paginationOptions.page - 1) * paginationOptions.limit).take(
      paginationOptions.limit,
    );

    const [entities, total] = await qb.getManyAndCount();

    const items = entities.map((e) => MemeMapper.toDomain(e));

    const meta = {
      totalItems: total,
      totalPages: Math.ceil(total / paginationOptions.limit) || 1,
      currentPage: paginationOptions.page,
      limit: paginationOptions.limit,
    };

    return { items, meta };
  }

  async findById(id: Meme['id']) {
    const entity = await this.memesRepository.findOne({ where: { id } });
    return entity ? MemeMapper.toDomain(entity) : null;
  }

  async findBySlug(slug: string) {
    const entity = await this.memesRepository.findOne({
      where: { slug },
      withDeleted: true,
    });
    return entity ? MemeMapper.toDomain(entity) : null;
  }

  async findByTitle(title: string) {
    const entity = await this.memesRepository.findOne({
      where: { title },
      withDeleted: true,
    });
    return entity ? MemeMapper.toDomain(entity) : null;
  }

  async findByFileId(fileId: string) {
    const entity = await this.memesRepository.findOne({
      where: { file: { id: fileId } },
      relations: ['file'],
      withDeleted: true,
    });
    return entity ? MemeMapper.toDomain(entity) : null;
  }

  async update(id: string, payload: Partial<Meme>): Promise<Meme> {
    const safePayload = { ...payload } as any;

    if (safePayload.template && safePayload.template.description === null)
      safePayload.template.description = undefined;
    const meme = await this.memesRepository.preload({
      id,
      ...safePayload,
    } as any);

    if (!meme) throw new NotFoundException('Meme not found');
    const updated = await this.memesRepository.save(meme);
    return MemeMapper.toDomain(updated);
  }

  async remove(id: Meme['id']): Promise<void> {
    await this.memesRepository.softDelete(id);
  }

  // Updated findByAuthorId to accept and return paginated results similar to findManyWithPagination
  async findByAuthorId(
    userId: string,
    {
      filterOptions,
      sortOptions,
      paginationOptions,
    }: {
      filterOptions?: MemeFilterOptionsDto | null;
      sortOptions?: MemeSortOptionsDto;
      paginationOptions: { page: number; limit: number };
    } = { paginationOptions: { page: 1, limit: 10 } },
  ): Promise<{ items: Meme[]; meta: PaginationMetaDto }> {
    const qb = this.memesRepository.createQueryBuilder('meme');

    qb.leftJoinAndSelect('meme.file', 'file')
      .leftJoinAndSelect('meme.author', 'author')
      .leftJoinAndSelect('meme.template', 'template')
      .where('author.id = :userId', { userId })
      // keep only non-deleted memes for an author's listing
      .andWhere('meme.deletedAt IS NULL');

    // Reuse the common query options but don't enforce public audience here
    this.applyCommonQueryOptions(qb, {
      filterOptions,
      sortOptions,
      enforceAudiencePublic: false,
    });

    // Ensure default pagination options if caller didn't provide any
    const effectivePagination = paginationOptions ?? { page: 1, limit: 10 };

    qb.skip((effectivePagination.page - 1) * effectivePagination.limit).take(
      effectivePagination.limit,
    );

    const [entities, total] = await qb.getManyAndCount();

    const items = entities.map((e) => MemeMapper.toDomain(e));

    const meta = {
      totalItems: total,
      totalPages: Math.ceil(total / effectivePagination.limit) || 1,
      currentPage: effectivePagination.page,
      limit: effectivePagination.limit,
    };

    return { items, meta };
  }

  /**
   * Shared helper that applies joins, filters and sorting to the provided QueryBuilder.
   * - If enforceAudiencePublic is true, it will add a filter to only include PUBLIC memes.
   * - It will also apply tag/template filters, search filter and sorting logic.
   */
  private applyCommonQueryOptions(
    qb: SelectQueryBuilder<MemeEntity>,
    opts: {
      filterOptions?: MemeFilterOptionsDto | null;
      sortOptions?: MemeSortOptionsDto;
      enforceAudiencePublic?: boolean;
    },
  ) {
    const { filterOptions, sortOptions, enforceAudiencePublic } = opts;

    // Ensure joins are present (if not already joined by caller)
    // Left joins are idempotent in TypeORM if used consistently
    qb.leftJoinAndSelect('meme.file', 'file')
      .leftJoinAndSelect('meme.author', 'author')
      .leftJoinAndSelect('meme.tags', 'tags')
      .leftJoinAndSelect('meme.template', 'template');

    if (isMemeFilterOptionsDto(filterOptions)) {
      // Join meme_tags for tag filtering
      if (filterOptions?.tags && filterOptions.tags.length > 0) {
        qb.andWhere(
          '(tags.name IN (:...tagIds) OR tags.slug IN (:...tagIds))',
          {
            tagIds: filterOptions.tags,
          },
        )
          // When joining tags, duplicates can appear; ensure distinct memes are returned
          .distinct(true);
      }

      // Filter by templateIds
      if (filterOptions?.templateIds && filterOptions.templateIds.length > 0) {
        qb.andWhere('meme.template IN (:...templateIds)', {
          templateIds: filterOptions.templateIds,
        });
      }
    }

    if (enforceAudiencePublic) {
      qb.andWhere('meme.audience = :audience', {
        audience: MemeAudience.PUBLIC,
      });
    }

    if (filterOptions?.search) {
      qb.andWhere('meme.title ILIKE :search', {
        search: `%${filterOptions.search}%`,
      });
    }

    // Sorting logic
    if (
      sortOptions?.orderBy === MemeSortField.UPVOTES ||
      sortOptions?.orderBy === MemeSortField.DOWNVOTES ||
      sortOptions?.orderBy === MemeSortField.REPORTS
    ) {
      // Subquery for interaction counts
      let interactionType = '';
      if (sortOptions.orderBy === MemeSortField.UPVOTES)
        interactionType = 'UPVOTE';
      if (sortOptions.orderBy === MemeSortField.DOWNVOTES)
        interactionType = 'DOWNVOTE';
      if (sortOptions.orderBy === MemeSortField.REPORTS)
        interactionType = 'REPORT';
      qb.addSelect(
        `(SELECT COUNT(*) FROM meme_interactions mi WHERE mi.meme_id = meme.id AND mi.type = :interactionType)`,
        'interactionCount',
      )
        .setParameter('interactionType', interactionType)
        .orderBy('interactionCount', sortOptions.order ?? 'DESC');
    } else if (sortOptions?.orderBy) {
      qb.addOrderBy(`meme.${sortOptions.orderBy}`, sortOptions.order ?? 'DESC');
    } else {
      qb.addOrderBy('meme.createdAt', 'DESC');
    }
  }
}
