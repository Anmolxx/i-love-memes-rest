import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommentStatus } from 'src/comments/comments.enum';
import { Comment } from 'src/comments/domain/comment';
import { CommentRepository } from 'src/comments/infrastructure/persistence/comment.repository';
import { NullableType } from 'src/utils/types/nullable.type';
import { IPaginationOptions } from 'src/utils/types/pagination-options';
import { IsNull, Repository } from 'typeorm';
import { CommentEntity } from '../entities/comment.entity';
import { CommentMapper } from '../mapper/comment.mapper';

@Injectable()
export class CommentRelationalRepository implements CommentRepository {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
  ) {}

  async create(
    data: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Comment> {
    const persistenceModel = CommentMapper.toPersistence(data as Comment);
    const newEntity = await this.commentRepository.save(
      this.commentRepository.create(persistenceModel),
    );
    return CommentMapper.toDomain(newEntity);
  }

  async findById(id: string): Promise<NullableType<Comment>> {
    const entity = await this.commentRepository.findOne({
      where: { id },
      relations: ['meme', 'author', 'parentComment'],
    });

    return entity ? CommentMapper.toDomain(entity) : null;
  }

  async findByMeme({
    memeId,
    paginationOptions,
    sortOptions = 'newest',
  }: {
    memeId: string;
    paginationOptions: IPaginationOptions;
    sortOptions?: 'newest' | 'oldest' | 'popular';
  }): Promise<{ data: Comment[]; total: number }> {
    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoinAndSelect('comment.meme', 'meme')
      .where('comment.meme_id = :memeId', { memeId })
      .andWhere('comment.parent_comment_id IS NULL')
      .andWhere('comment.deletedAt IS NULL');

    // Apply sorting
    switch (sortOptions) {
      case 'oldest':
        queryBuilder.orderBy('comment.createdAt', 'ASC');
        break;
      case 'popular':
        queryBuilder.orderBy('comment.replyCount', 'DESC');
        break;
      case 'newest':
      default:
        queryBuilder.orderBy('comment.createdAt', 'DESC');
        break;
    }

    const entities = await queryBuilder
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .take(paginationOptions.limit)
      .getMany();

    const total = await queryBuilder.getCount();

    return {
      data: entities.map((entity) => CommentMapper.toDomain(entity)),
      total,
    };
  }

  async findReplies({
    parentCommentId,
    paginationOptions,
  }: {
    parentCommentId: string;
    paginationOptions: IPaginationOptions;
  }): Promise<{ data: Comment[]; total: number }> {
    const entities = await this.commentRepository.find({
      where: {
        parentComment: { id: parentCommentId },
        deletedAt: IsNull(),
      },
      relations: ['author', 'meme'],
      order: { createdAt: 'ASC' },
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });

    const total = await this.commentRepository.count({
      where: {
        parentComment: { id: parentCommentId },
        deletedAt: IsNull(),
      },
    });

    return {
      data: entities.map((entity) => CommentMapper.toDomain(entity)),
      total,
    };
  }

  async update(id: string, payload: Partial<Comment>): Promise<Comment | null> {
    const entity = await this.commentRepository.findOne({
      where: { id },
      relations: ['meme', 'author', 'parentComment'],
    });

    if (!entity) {
      return null;
    }

    const updatedEntity = await this.commentRepository.save(
      this.commentRepository.create(
        CommentMapper.toPersistence({
          ...CommentMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return CommentMapper.toDomain(updatedEntity);
  }

  async remove(id: string): Promise<void> {
    await this.commentRepository.update(id, {
      content: '[deleted]',
      status: CommentStatus.DELETED,
    });
    await this.commentRepository.softDelete(id);
  }

  async incrementReplyCount(id: string): Promise<void> {
    await this.commentRepository.increment({ id }, 'replyCount', 1);
  }

  async decrementReplyCount(id: string): Promise<void> {
    await this.commentRepository.decrement({ id }, 'replyCount', 1);
  }
}
