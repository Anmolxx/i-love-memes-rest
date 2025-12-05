import { Comment } from '../../../../domain/comment';
import { CommentEntity } from '../entities/comment.entity';

export class CommentMapper {
  static toDomain(raw: CommentEntity): Comment {
    const comment = new Comment();
    comment.id = raw.id;
    comment.content = raw.content;
    comment.meme = raw.meme;
    comment.author = raw.author;
    comment.parentComment = raw.parentComment;
    comment.parentCommentId = raw.parentCommentId;
    comment.replyCount = raw.replyCount;
    comment.depth = raw.depth;
    comment.status = raw.status;
    comment.createdAt = raw.createdAt;
    comment.updatedAt = raw.updatedAt;
    comment.editedAt = raw.editedAt;
    comment.deletedAt = raw.deletedAt;
    return comment;
  }

  static toPersistence(comment: Comment): CommentEntity {
    const entity = new CommentEntity();
    if (comment.id) {
      entity.id = comment.id;
    }
    entity.content = comment.content;
    entity.meme = comment.meme;
    entity.author = comment.author;
    entity.parentComment = comment.parentComment ?? null;
    entity.replyCount = comment.replyCount;
    entity.depth = comment.depth;
    entity.status = comment.status as any;
    entity.createdAt = comment.createdAt;
    entity.updatedAt = comment.updatedAt;
    entity.editedAt = comment.editedAt ?? null;
    if (comment.deletedAt) {
      entity.deletedAt = comment.deletedAt;
    }
    return entity;
  }
}
