import { DeepPartial } from 'src/utils/types/deep-partial.type';
import { NullableType } from 'src/utils/types/nullable.type';
import { IPaginationOptions } from 'src/utils/types/pagination-options';
import { Comment } from '../../domain/comment';

export abstract class CommentRepository {
  abstract create(
    data: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Comment>;

  abstract findById(id: string): Promise<NullableType<Comment>>;

  abstract findByMeme({
    memeId,
    paginationOptions,
    sortBy,
  }: {
    memeId: string;
    paginationOptions: IPaginationOptions;
    sortBy?: 'newest' | 'oldest' | 'popular';
  }): Promise<Comment[]>;

  abstract findReplies({
    parentCommentId,
    paginationOptions,
  }: {
    parentCommentId: string;
    paginationOptions: IPaginationOptions;
  }): Promise<Comment[]>;

  abstract update(
    id: string,
    payload: DeepPartial<Comment>,
  ): Promise<Comment | null>;

  abstract remove(id: string): Promise<void>;

  abstract incrementReplyCount(id: string): Promise<void>;

  abstract decrementReplyCount(id: string): Promise<void>;
}
