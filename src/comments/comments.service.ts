import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Comment } from 'src/comments/domain/comment';
import { API_PAGE_LIMIT } from 'src/constants/common.constant';
import { MemesRepository } from 'src/memes/infrastructure/persistence/meme.repository';
import { isUUID } from 'src/utils/slug.util';
import { NullableType } from 'src/utils/types/nullable.type';
import { CommentStatus } from './comments.enum';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryCommentDto } from './dto/query-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentRepository } from './infrastructure/persistence/comment.repository';

const MAX_COMMENT_DEPTH = 5;
const EDIT_WINDOW_HOURS = 24;

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly memeRepository: MemesRepository,
  ) {}

  async create(createCommentDto: CreateCommentDto, userId: string) {
    const { content, memeId: memeSlugOrId, parentCommentId } = createCommentDto;

    // Resolve meme slug to ID
    let meme = await this.memeRepository.findBySlug(memeSlugOrId);
    if (!meme && isUUID(memeSlugOrId)) {
      meme = await this.memeRepository.findById(memeSlugOrId);
    }
    if (!meme) {
      throw new NotFoundException(
        `Meme with identifier ${memeSlugOrId} not found`,
      );
    }

    let depth = 0;
    let parentComment: NullableType<Comment> = null;

    if (parentCommentId) {
      parentComment = await this.commentRepository.findById(parentCommentId);

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }

      if (parentComment.status === CommentStatus.DELETED) {
        throw new BadRequestException('Cannot reply to deleted comment');
      }

      depth = parentComment.depth + 1;

      if (depth > MAX_COMMENT_DEPTH) {
        throw new BadRequestException(
          `Maximum comment depth of ${MAX_COMMENT_DEPTH} exceeded`,
        );
      }
    }

    const comment = await this.commentRepository.create({
      content,
      meme: { id: meme.id } as any,
      author: { id: userId } as any,
      parentComment: parentCommentId
        ? ({ id: parentCommentId } as Partial<Comment>)
        : null,
      replyCount: 0,
      depth,
      status: CommentStatus.ACTIVE,
    } as any);

    // Increment parent's reply count
    if (parentCommentId) {
      await this.commentRepository.incrementReplyCount(parentCommentId);
    }

    return comment;
  }

  async findByMeme(memeSlugOrId: string, query: QueryCommentDto) {
    // Resolve meme slug to ID
    let meme = await this.memeRepository.findBySlug(memeSlugOrId);
    if (!meme && isUUID(memeSlugOrId)) {
      meme = await this.memeRepository.findById(memeSlugOrId);
    }
    if (!meme) {
      throw new NotFoundException(
        `Meme with identifier ${memeSlugOrId} not found`,
      );
    }

    const page = query.page || 1;
    let limit = query.limit || 10;
    if (limit > API_PAGE_LIMIT) limit = API_PAGE_LIMIT;

    return this.commentRepository.findByMeme({
      memeId: meme.id,
      paginationOptions: {
        page,
        limit,
      },
      sortOptions: query.sortOptions,
    });
  }

  async findReplies(parentCommentId: string, query: QueryCommentDto) {
    const parentComment =
      await this.commentRepository.findById(parentCommentId);

    if (!parentComment) {
      throw new NotFoundException('Parent comment not found');
    }

    const page = query.page || 1;
    let limit = query.limit || 10;
    if (limit > API_PAGE_LIMIT) limit = API_PAGE_LIMIT;

    return this.commentRepository.findReplies({
      parentCommentId,
      paginationOptions: {
        page,
        limit,
      },
    });
  }

  async findOne(id: string) {
    const comment = await this.commentRepository.findById(id);

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  async update(id: string, updateCommentDto: UpdateCommentDto, userId: string) {
    const comment = await this.commentRepository.findById(id);

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.author.id !== userId) {
      throw new UnauthorizedException('You can only edit your own comments');
    }

    // Check edit window
    const now = new Date();
    const createdAt = new Date(comment.createdAt);
    const hoursSinceCreation =
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreation > EDIT_WINDOW_HOURS) {
      throw new BadRequestException(
        `Comments can only be edited within ${EDIT_WINDOW_HOURS} hours`,
      );
    }

    return this.commentRepository.update(id, {
      content: updateCommentDto.content,
      status: CommentStatus.EDITED,
      editedAt: now,
    } as any);
  }

  async remove(id: string, userId: string) {
    const comment = await this.commentRepository.findById(id);

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.author.id !== userId) {
      throw new UnauthorizedException('You can only delete your own comments');
    }

    await this.commentRepository.remove(id);

    // Decrement parent's reply count if applicable
    if (comment.parentComment) {
      await this.commentRepository.decrementReplyCount(
        comment.parentComment.id,
      );
    }
  }
}
