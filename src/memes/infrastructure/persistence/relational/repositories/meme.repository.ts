import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MemeInteraction } from 'src/interactions/domain/meme-interaction';
import { Meme } from 'src/memes/domain/meme';
import {
  IMemeFilters,
  MemeSortField,
} from 'src/memes/dto/meme-filter-options.dto';
import { MemesRepository } from 'src/memes/infrastructure/persistence/meme.repository';
import { MemeEntity } from 'src/memes/infrastructure/persistence/relational/entities/meme.entity';
import { MemeMapper } from 'src/memes/infrastructure/persistence/relational/mapper/meme.mapper';
import {
  ALLTIME_MEME_SCORING_CONFIG,
  DEFAULT_MEME_SCORING_CONFIG,
  MemeScoringConfig,
  TRENDING_MEME_SCORING_CONFIG,
} from 'src/memes/meme-scoring.config';
import { MemeAudience } from 'src/memes/memes.enum';
import { PaginationMetaDto } from 'src/utils/dto/pagination-response.dto';
import {
  IFilterOptions,
  ISortOptions,
} from 'src/utils/types/pagination-options';
import { Repository, SelectQueryBuilder } from 'typeorm';

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
    currentUserId,
  }: {
    filterOptions?: IFilterOptions<IMemeFilters> | null;
    sortOptions?: ISortOptions<MemeSortField>;
    paginationOptions: { page: number; limit: number };
    currentUserId?: string;
  }): Promise<{ items: Meme[]; meta: PaginationMetaDto }> {
    const qb = this.memesRepository.createQueryBuilder('meme');

    // Apply filters + sorting for data query
    this.applyCommonQueryOptions(qb, {
      filterOptions,
      sortOptions,
      enforceAudiencePublic: true,
      currentUserId,
    });

    qb.skip((paginationOptions.page - 1) * paginationOptions.limit).take(
      paginationOptions.limit,
    );

    // Use getRawAndEntities to get both raw computed columns and entities
    const { raw, entities } = await qb.getRawAndEntities();

    // Build separate count query without ordering and computed selects
    const countQb = this.buildCountQuery(filterOptions, true);
    const total = await countQb.getCount();

    // Merge computed columns from raw into entities
    let mergedEntities = this.mergeRawComputedColumns(entities, raw);

    // If user is logged in, fetch and merge their interactions separately
    if (currentUserId && mergedEntities.length > 0) {
      const memeIds = mergedEntities.map((e) => e.id);
      const userInteractionMap = await this.fetchUserInteractionsForMemes(
        memeIds,
        currentUserId,
      );
      mergedEntities = this.mergeUserInteractions(
        mergedEntities,
        userInteractionMap,
      );
    }

    const items = mergedEntities.map((e) => MemeMapper.toDomain(e));

    const meta = {
      totalItems: total,
      totalPages: Math.ceil(total / paginationOptions.limit) || 1,
      currentPage: paginationOptions.page,
      limit: paginationOptions.limit,
    };

    return { items, meta };
  }

  async findById(
    id: Meme['id'],
    currentUserId?: string,
    withDeleted: boolean = false,
  ) {
    return this.findOneWithInteractions({ id }, currentUserId, withDeleted);
  }

  async findBySlug(
    slug: string,
    currentUserId?: string,
    withDeleted: boolean = false,
  ) {
    return this.findOneWithInteractions({ slug }, currentUserId, withDeleted);
  }

  /**
   * Find a single meme with interaction statistics and user-specific interactions
   */
  private async findOneWithInteractions(
    where: { id?: string; slug?: string },
    currentUserId?: string,
    withDeleted = false,
  ): Promise<Meme | null> {
    const qb = this.memesRepository.createQueryBuilder('meme');

    // Apply where condition
    if (where.id) {
      qb.where('meme.id = :id', { id: where.id });
    } else if (where.slug) {
      qb.where('meme.slug = :slug', { slug: where.slug });
    }

    // Include soft-deleted if requested
    if (withDeleted) {
      qb.withDeleted();
    }

    // Apply base joins and interaction selects
    this.applyBaseJoins(qb);
    this.addInteractionCountSelects(qb);

    // Get raw and entity
    const { raw, entities } = await qb.getRawAndEntities();

    if (entities.length === 0) {
      return null;
    }

    // Merge computed columns
    let mergedEntities = this.mergeRawComputedColumns(entities, raw);

    // If user is logged in, fetch and merge their interactions separately
    if (currentUserId) {
      const memeIds = mergedEntities.map((e) => e.id);
      const userInteractionMap = await this.fetchUserInteractionsForMemes(
        memeIds,
        currentUserId,
      );
      mergedEntities = this.mergeUserInteractions(
        mergedEntities,
        userInteractionMap,
      );
    }

    return MemeMapper.toDomain(mergedEntities[0]);
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
      currentUserId,
    }: {
      filterOptions?: IFilterOptions<IMemeFilters> | null;
      sortOptions?: ISortOptions<MemeSortField>;
      paginationOptions: { page: number; limit: number };
      currentUserId?: string;
    } = { paginationOptions: { page: 1, limit: 10 } },
  ): Promise<{ items: Meme[]; meta: PaginationMetaDto }> {
    const qb = this.memesRepository.createQueryBuilder('meme');

    // Apply base where for author before applyCommonQueryOptions
    qb.where('author.id = :userId', { userId });

    // Reuse the common query options but don't enforce public audience here
    this.applyCommonQueryOptions(qb, {
      filterOptions,
      sortOptions,
      enforceAudiencePublic: false,
      currentUserId,
    });

    // Ensure default pagination options if caller didn't provide any
    const effectivePagination = paginationOptions ?? { page: 1, limit: 10 };

    qb.skip((effectivePagination.page - 1) * effectivePagination.limit).take(
      effectivePagination.limit,
    );

    // Use getRawAndEntities to get both raw computed columns and entities
    const { raw, entities } = await qb.getRawAndEntities();

    // Build separate count query for accurate total
    const countQb = this.buildCountQuery(filterOptions, false);
    countQb.andWhere('author.id = :userId', { userId });
    const total = await countQb.getCount();

    // Merge computed columns from raw into entities
    let mergedEntities = this.mergeRawComputedColumns(entities, raw);

    // If user is logged in, fetch and merge their interactions separately
    if (currentUserId && mergedEntities.length > 0) {
      const memeIds = mergedEntities.map((e) => e.id);
      const userInteractionMap = await this.fetchUserInteractionsForMemes(
        memeIds,
        currentUserId,
      );
      mergedEntities = this.mergeUserInteractions(
        mergedEntities,
        userInteractionMap,
      );
    }

    const items = mergedEntities.map((e) => MemeMapper.toDomain(e));

    const meta = {
      totalItems: total,
      totalPages: Math.ceil(total / effectivePagination.limit) || 1,
      currentPage: effectivePagination.page,
      limit: effectivePagination.limit,
    };

    return { items, meta };
  }

  async findDeletedWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
    currentUserId,
  }: {
    filterOptions?: IFilterOptions<IMemeFilters> | null;
    sortOptions?: ISortOptions<MemeSortField>;
    paginationOptions: { page: number; limit: number };
    currentUserId?: string;
  }): Promise<{ items: Meme[]; meta: PaginationMetaDto }> {
    const qb = this.memesRepository.createQueryBuilder('meme');

    // Include only deleted records
    qb.withDeleted().where('meme.deletedAt IS NOT NULL');

    // Apply base joins and selects
    this.applyCommonQueryOptions(qb, {
      filterOptions,
      sortOptions,
      enforceAudiencePublic: false,
      currentUserId,
    });

    qb.skip((paginationOptions.page - 1) * paginationOptions.limit).take(
      paginationOptions.limit,
    );

    const { raw, entities } = await qb.getRawAndEntities();

    // Build separate count query
    const countQb = this.memesRepository.createQueryBuilder('meme');
    countQb.withDeleted().where('meme.deletedAt IS NOT NULL');
    this.applyBaseJoins(countQb);
    this.applyFilters(countQb, filterOptions, false);
    const total = await countQb.getCount();

    let mergedEntities = this.mergeRawComputedColumns(entities, raw);

    // If user is logged in, fetch and merge their interactions separately
    if (currentUserId && mergedEntities.length > 0) {
      const memeIds = mergedEntities.map((e) => e.id);
      const userInteractionMap = await this.fetchUserInteractionsForMemes(
        memeIds,
        currentUserId,
      );
      mergedEntities = this.mergeUserInteractions(
        mergedEntities,
        userInteractionMap,
      );
    }

    const items = mergedEntities.map((e) => MemeMapper.toDomain(e));

    const meta = {
      totalItems: total,
      totalPages: Math.ceil(total / paginationOptions.limit) || 1,
      currentPage: paginationOptions.page,
      limit: paginationOptions.limit,
    };

    return { items, meta };
  }

  // New: findByAuthorIdDeleted
  async findByAuthorIdDeleted(
    userId: string,
    {
      filterOptions,
      sortOptions,
      paginationOptions,
      currentUserId,
    }: {
      filterOptions?: IFilterOptions<IMemeFilters> | null;
      sortOptions?: ISortOptions<MemeSortField>;
      paginationOptions: { page: number; limit: number };
      currentUserId?: string;
    },
  ): Promise<{ items: Meme[]; meta: PaginationMetaDto }> {
    const qb = this.memesRepository.createQueryBuilder('meme');

    qb.withDeleted();
    qb.where('meme.deletedAt IS NOT NULL');
    qb.andWhere('author.id = :userId', { userId });

    this.applyCommonQueryOptions(qb, {
      filterOptions,
      sortOptions,
      enforceAudiencePublic: false,
      currentUserId,
    });

    qb.skip((paginationOptions.page - 1) * paginationOptions.limit).take(
      paginationOptions.limit,
    );

    const { raw, entities } = await qb.getRawAndEntities();

    const countQb = this.memesRepository.createQueryBuilder('meme');
    countQb.withDeleted();
    countQb.where('meme.deletedAt IS NOT NULL');
    countQb.andWhere('author.id = :userId', { userId });
    this.applyBaseJoins(countQb);
    this.applyFilters(countQb, filterOptions, false);
    const total = await countQb.getCount();

    let mergedEntities = this.mergeRawComputedColumns(entities, raw);

    // If user is logged in, fetch and merge their interactions separately
    if (currentUserId && mergedEntities.length > 0) {
      const memeIds = mergedEntities.map((e) => e.id);
      const userInteractionMap = await this.fetchUserInteractionsForMemes(
        memeIds,
        currentUserId,
      );
      mergedEntities = this.mergeUserInteractions(
        mergedEntities,
        userInteractionMap,
      );
    }

    const items = mergedEntities.map((e) => MemeMapper.toDomain(e));

    const meta = {
      totalItems: total,
      totalPages: Math.ceil(total / paginationOptions.limit) || 1,
      currentPage: paginationOptions.page,
      limit: paginationOptions.limit,
    };

    return { items, meta };
  }

  // New: restore
  async restore(id: string): Promise<void> {
    await this.memesRepository.restore(id);
  }

  // New: hardDelete
  async hardDelete(
    id: string,
  ): Promise<{ fileId?: string; filePath?: string } | any> {
    // Perform deletion in a transaction to ensure meme row is removed first
    // so ON DELETE CASCADE removes comments and interactions, then remove file row
    return await this.memesRepository.manager.connection.transaction(
      async (manager) => {
        // Load meme with file relation using the transactional manager
        const meme = await manager.findOne(MemeEntity, {
          where: { id },
          relations: ['file'],
          withDeleted: true,
        });

        if (!meme) {
          // Nothing to delete
          return { fileId: undefined };
        }

        const fileId = meme.file?.id;
        const filePath = meme.file?.path;

        // Delete meme first (triggers ON DELETE CASCADE for comments/interactions/meme_tags)
        await manager.delete(MemeEntity, { id });

        // If a file exists, delete its DB record as part of same transaction
        if (fileId) {
          await manager.delete('file', { id: fileId });
        }

        return { fileId, filePath };
      },
    );
  }

  /**
   * Apply base joins to query builder
   */
  private applyBaseJoins(qb: SelectQueryBuilder<MemeEntity>): void {
    qb.leftJoinAndSelect('meme.file', 'file')
      .leftJoinAndSelect('meme.author', 'author')
      .leftJoinAndSelect('meme.tags', 'tags')
      .leftJoinAndSelect('meme.template', 'template');
  }

  /**
   * Apply common filters to query builder (tags, templates, audience, search, deleted)
   * Uses andWhere() so it works with or without existing where clauses
   */
  private applyFilters(
    qb: SelectQueryBuilder<MemeEntity>,
    filterOptions?: IFilterOptions<IMemeFilters> | null,
    enforceAudiencePublic?: boolean,
  ): void {
    // Only filter out soft-deleted records when the query builder does not
    // explicitly include deleted rows (i.e. .withDeleted() was NOT called).
    // This prevents contradictory WHERE clauses like "deletedAt IS NOT NULL AND deletedAt IS NULL"
    // when callers intentionally requested deleted records via qb.withDeleted().
    // NOTE: TypeORM sets qb.expressionMap.withDeleted when .withDeleted() is used.
    if (!qb.expressionMap || !qb.expressionMap.withDeleted) {
      qb.andWhere('meme.deletedAt IS NULL');
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

    if (filterOptions?.tags && filterOptions.tags.length > 0) {
      qb.andWhere('(tags.name IN (:...tagIds) OR tags.slug IN (:...tagIds))', {
        tagIds: filterOptions.tags,
      }).distinct(true);
    }

    if (filterOptions?.templateIds && filterOptions.templateIds.length > 0) {
      qb.andWhere('meme.template IN (:...templateIds)', {
        templateIds: filterOptions.templateIds,
      });
    }

    // Filter by reported status (admin-only filter enforced at controller level)
    if (typeof filterOptions?.reported === 'boolean') {
      if (filterOptions.reported) {
        qb.andWhere(
          `EXISTS (SELECT 1 FROM meme_interactions mi WHERE mi.meme_id = meme.id AND mi.type = 'REPORT')`,
        );

        // Filter by report reasons (implies REPORT interactions)
        if (filterOptions?.reasons && filterOptions.reasons.length > 0) {
          qb.andWhere(
            `EXISTS (SELECT 1 FROM meme_interactions mi WHERE mi.meme_id = meme.id AND mi.type = 'REPORT' AND mi.reason IN (:...reasonFilter))`,
          ).setParameter('reasonFilter', filterOptions.reasons);
        }
      }
    }

    // Filter by flagged status (admin-only filter enforced at controller level)
    if (typeof filterOptions?.flagged === 'boolean') {
      if (filterOptions.flagged) {
        qb.andWhere(
          `EXISTS (SELECT 1 FROM meme_interactions mi WHERE mi.meme_id = meme.id AND mi.type = 'FLAG')`,
        );
      }
    }

    // Generic interactionType filter (works independently of reported/flagged booleans)
    if (filterOptions?.interactionType) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM meme_interactions mi WHERE mi.meme_id = meme.id AND mi.type = :interactionTypeFilter)`,
      ).setParameter('interactionTypeFilter', filterOptions.interactionType);
    }

    // Filter by reasons if provided without reported boolean (assume REPORT type)
    if (
      filterOptions?.reasons &&
      filterOptions.reasons.length > 0 &&
      typeof filterOptions?.reported !== 'boolean'
    ) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM meme_interactions mi WHERE mi.meme_id = meme.id AND mi.type = 'REPORT' AND mi.reason IN (:...reasonFilter))`,
      ).setParameter('reasonFilter', filterOptions.reasons);
    }
  }

  /**
   * Add interaction count selects to query builder (global stats only)
   */
  private addInteractionCountSelects(qb: SelectQueryBuilder<MemeEntity>): void {
    qb.addSelect(
      `(SELECT COALESCE(COUNT(*), 0) FROM meme_interactions mi WHERE mi.meme_id = meme.id AND mi.type = 'UPVOTE')`,
      'interaction_upvote_count',
    );
    qb.addSelect(
      `(SELECT COALESCE(COUNT(*), 0) FROM meme_interactions mi WHERE mi.meme_id = meme.id AND mi.type = 'DOWNVOTE')`,
      'interaction_downvote_count',
    );
    qb.addSelect(
      `(SELECT COALESCE(COUNT(*), 0) FROM meme_interactions mi WHERE mi.meme_id = meme.id AND mi.type = 'REPORT')`,
      'interaction_report_count',
    );
    qb.addSelect(
      `(SELECT COALESCE(COUNT(*), 0) FROM meme_interactions mi WHERE mi.meme_id = meme.id AND mi.type = 'FLAG')`,
      'interaction_flag_count',
    );
    qb.addSelect(
      `( (SELECT COALESCE(COUNT(*), 0) FROM meme_interactions mi WHERE mi.meme_id = meme.id AND mi.type = 'UPVOTE') - (SELECT COALESCE(COUNT(*), 0) FROM meme_interactions mi WHERE mi.meme_id = meme.id AND mi.type = 'DOWNVOTE') )`,
      'interaction_net_score',
    );
  }

  /**
   * Fetch user-specific interactions for a list of meme IDs
   * Returns a map of memeId -> user interactions array
   */
  private async fetchUserInteractionsForMemes(
    memeIds: string[],
    userId: string,
  ): Promise<Map<string, MemeInteraction[]>> {
    if (!memeIds.length || !userId) {
      return new Map();
    }

    const rawInteractions: any[] = await this.memesRepository.manager.query(
      `
      SELECT 
        mi.meme_id,
        json_agg(
          json_build_object(
            'type', mi.type, 
            'createdAt', mi."createdAt", 
            'reason', mi.reason, 
            'note', mi.note
          )
          ORDER BY mi."createdAt" DESC
        ) as interactions
      FROM meme_interactions mi
      WHERE mi.meme_id = ANY($1) AND mi.user_id = $2
      GROUP BY mi.meme_id
    `,
      [memeIds, userId],
    );

    const interactionMap = new Map<string, MemeInteraction[]>();
    for (const row of rawInteractions) {
      let interactions: MemeInteraction[] = [];
      if (row.interactions) {
        if (typeof row.interactions === 'string') {
          try {
            interactions = JSON.parse(row.interactions) as MemeInteraction[];
          } catch {
            interactions = [];
          }
        } else if (Array.isArray(row.interactions)) {
          interactions = row.interactions as MemeInteraction[];
        }
      }

      interactionMap.set(row.meme_id, interactions);
    }

    return interactionMap;
  }

  /**
   * Merge user interactions into meme entities
   */
  private mergeUserInteractions(
    entities: MemeEntity[],
    interactionMap: Map<string, MemeInteraction[]>,
  ): MemeEntity[] {
    return entities.map((entity) => {
      const userInteractions = interactionMap.get(entity.id) ?? [];
      if (userInteractions.length > 0) {
        // Store as JSON string to match the expected format in mapper
        (entity as any)['user_interactions'] = JSON.stringify(userInteractions);
      }
      return entity;
    });
  }

  /**
   * Apply sorting logic to query builder
   */
  private applySorting(
    qb: SelectQueryBuilder<MemeEntity>,
    sortOptions?: ISortOptions<MemeSortField>,
  ): void {
    if (
      sortOptions?.orderBy === MemeSortField.UPVOTES ||
      sortOptions?.orderBy === MemeSortField.DOWNVOTES ||
      sortOptions?.orderBy === MemeSortField.REPORTS
    ) {
      let interactionType = '';
      if (sortOptions.orderBy === MemeSortField.UPVOTES)
        interactionType = 'UPVOTE';
      if (sortOptions.orderBy === MemeSortField.DOWNVOTES)
        interactionType = 'DOWNVOTE';
      if (sortOptions.orderBy === MemeSortField.REPORTS)
        interactionType = 'REPORT';
      qb.addSelect(
        `(SELECT COUNT(*) FROM meme_interactions mi WHERE mi.meme_id = meme.id AND mi.type = :interactionType)`,
        'interaction_count',
      )
        .setParameter('interactionType', interactionType)
        .orderBy('interaction_count', sortOptions.order ?? 'DESC');
    } else if (
      sortOptions?.orderBy === MemeSortField.TRENDING ||
      sortOptions?.orderBy === MemeSortField.SCORE
    ) {
      let cfg: MemeScoringConfig;

      switch (sortOptions.orderBy) {
        case MemeSortField.TRENDING:
          // Use the respective scoring configuration
          cfg = TRENDING_MEME_SCORING_CONFIG;
          break;
        case MemeSortField.SCORE:
          cfg = ALLTIME_MEME_SCORING_CONFIG;
          break;

        default:
          cfg = DEFAULT_MEME_SCORING_CONFIG;
          break;
      }

      const rawScore = `
        (
          (
            (SELECT COALESCE(COUNT(*), 0) FROM meme_interactions mi 
             WHERE mi.meme_id = meme.id AND mi.type = 'UPVOTE') * ${cfg.upvoteWeight}
            +
            (SELECT COALESCE(COUNT(*), 0) FROM meme_interactions mi 
             WHERE mi.meme_id = meme.id AND mi.type = 'DOWNVOTE') * ${cfg.downvoteWeight}
            +
            (SELECT COALESCE(COUNT(*), 0) FROM meme_interactions mi 
             WHERE mi.meme_id = meme.id AND mi.type = 'REPORT') * ${cfg.reportWeight}
            +
            (SELECT COALESCE(COUNT(*), 0) FROM meme_interactions mi 
             WHERE mi.meme_id = meme.id AND mi.type = 'FLAG') * ${cfg.flagWeight}
          )
          *
          POWER(
            0.5,
            GREATEST(0, EXTRACT(EPOCH FROM (NOW() - meme."createdAt")) / 3600 - ${cfg.ageThresholdHours}) / ${cfg.ageThresholdHours} * ${cfg.timeDecayFactor}
          )
          *
          CASE
            WHEN EXTRACT(EPOCH FROM (NOW() - meme."createdAt")) / 3600 < ${cfg.recencyBonusHours}
            THEN ${cfg.recencyBonusMultiplier}
            ELSE 1.0
          END
        )
      `;

      const scoreFormula = `GREATEST(${rawScore}, ${cfg.minScore})`;
      qb.addSelect(scoreFormula, 'calculated_score');
      qb.orderBy('calculated_score', sortOptions.order ?? 'DESC');
    } else if (sortOptions?.orderBy) {
      qb.addOrderBy(`meme.${sortOptions.orderBy}`, sortOptions.order ?? 'DESC');
    } else {
      qb.addOrderBy('meme.createdAt', 'DESC');
    }
  }

  /**
   * Build a count query with filters applied
   * Initializes with a base where condition to ensure proper query building
   */
  private buildCountQuery(
    filterOptions?: IFilterOptions<IMemeFilters> | null,
    enforceAudiencePublic?: boolean,
  ): SelectQueryBuilder<MemeEntity> {
    const countQb = this.memesRepository.createQueryBuilder('meme');
    // Initialize with a base where to allow andWhere in filters
    countQb.where('1=1');
    this.applyBaseJoins(countQb);
    this.applyFilters(countQb, filterOptions, enforceAudiencePublic);
    return countQb;
  }

  /**
   * Shared helper that applies joins, filters and sorting to the provided QueryBuilder.
   */
  private applyCommonQueryOptions(
    qb: SelectQueryBuilder<MemeEntity>,
    opts: {
      filterOptions?: IFilterOptions<IMemeFilters> | null;
      sortOptions?: ISortOptions<MemeSortField>;
      enforceAudiencePublic?: boolean;
      currentUserId?: string;
    },
  ) {
    const { filterOptions, sortOptions, enforceAudiencePublic } = opts;

    this.applyBaseJoins(qb);
    this.addInteractionCountSelects(qb);
    this.applyFilters(qb, filterOptions, enforceAudiencePublic);
    this.applySorting(qb, sortOptions);
  }

  /**
   * Merge raw computed columns from query results into entity objects
   */
  private mergeRawComputedColumns<T extends { id?: string }>(
    entities: T[],
    raw: any[],
  ): T[] {
    const computedColumns = [
      'interaction_upvote_count',
      'interaction_downvote_count',
      'interaction_report_count',
      'interaction_flag_count',
      'interaction_net_score',
      'calculated_score',
    ];

    // If no raw rows, just return entities unchanged
    if (!raw || raw.length === 0) {
      return entities;
    }

    return entities.map((entity, idx) => {
      const entityId = (entity as any).id;

      // Try to find the raw row that corresponds to this entity by matching any value to the entity id.
      // This handles cases where joins produced multiple raw rows per entity and ordering doesn't match.
      let matchedRow = raw.find((r) =>
        Object.values(r).some((v) => v === entityId || v === String(entityId)),
      );

      // Fallback: if no match found, use raw at same index (preserve previous behavior)
      if (!matchedRow) {
        matchedRow = raw[idx] ?? {};
      }

      computedColumns.forEach((key) => {
        (entity as any)[key] = matchedRow[key];
      });

      return entity;
    });
  }

  async clearTemplateReferences(
    templateId: string,
    transactionalEntityManager?: any,
  ): Promise<void> {
    const manager = transactionalEntityManager ?? this.memesRepository.manager;
    const queryBuilder = manager
      .createQueryBuilder()
      .update(MemeEntity)
      .set({ template: null })
      .where('template.id = :templateId', { templateId });

    await queryBuilder.execute();
  }
}
