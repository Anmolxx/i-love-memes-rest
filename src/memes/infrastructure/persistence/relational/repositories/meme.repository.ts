import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    filterOptions?: any | null;
    sortOptions: {
      orderBy: string;
      order: 'ASC' | 'DESC';
    };
    paginationOptions: { page: number; limit: number };
  }): Promise<{ items: Meme[]; meta: PaginationMetaDto }> {
    const qb = this.memesRepository.createQueryBuilder('meme');

    qb.leftJoinAndSelect('meme.file', 'file')
      .leftJoinAndSelect('meme.author', 'author')
      .leftJoinAndSelect('meme.template', 'template');

    qb.where('meme.audience = :audience', { audience: MemeAudience.PUBLIC });

    if (filterOptions?.search) {
      qb.andWhere('meme.title ILIKE :search', {
        search: `%${filterOptions.search}%`,
      });
    }

    qb.addOrderBy(`meme.${sortOptions.orderBy}`, sortOptions.order);
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
    const meme = await this.memesRepository.preload({ id, ...payload });
    if (!meme) throw new NotFoundException('Meme not found');
    const updated = await this.memesRepository.save(meme);
    return MemeMapper.toDomain(updated);
  }

  async remove(id: Meme['id']): Promise<void> {
    await this.memesRepository.softDelete(id);
  }

  async findByAuthorId(userId: string): Promise<Meme[]> {
    const qb = this.memesRepository.createQueryBuilder('meme');

    qb.leftJoinAndSelect('meme.file', 'file')
      .leftJoinAndSelect('meme.author', 'author')
      .leftJoinAndSelect('meme.template', 'template')
      .where('author.id = :userId', { userId })
      .andWhere('meme.deletedAt IS NULL');

    const entities = await qb.getMany();
    return entities.map((e) => MemeMapper.toDomain(e));
  }
}
