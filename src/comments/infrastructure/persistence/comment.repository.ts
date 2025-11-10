import { DeepPartial } from 'src/utils/types/deep-partial.type';
import { NullableType } from 'src/utils/types/nullable.type';
import { IPaginationOptions } from 'src/utils/types/pagination-options';
import { PaginationMetaDto } from '../../../utils/dto/pagination-response.dto';
import { Comment } from '../../domain/comment';

export abstract class CommentRepository {
  abstract create(
    data: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Comment>;

  abstract findById(id: string): Promise<NullableType<Comment>>;

  abstract findByMeme({
    memeId,
    paginationOptions,
    sortOptions,
  }: {
    memeId: string;
    paginationOptions: IPaginationOptions;
    sortOptions?: 'newest' | 'oldest' | 'popular';
  }): Promise<{ items: Comment[]; meta: PaginationMetaDto }>;

  abstract findReplies({
    parentCommentId,
    paginationOptions,
  }: {
    parentCommentId: string;
    paginationOptions: IPaginationOptions;
  }): Promise<{ items: Comment[]; meta: PaginationMetaDto }>;

  abstract update(
    id: string,
    payload: DeepPartial<Comment>,
  ): Promise<Comment | null>;

  abstract remove(id: string): Promise<void>;

  abstract incrementReplyCount(id: string): Promise<void>;

  abstract decrementReplyCount(id: string): Promise<void>;
}
