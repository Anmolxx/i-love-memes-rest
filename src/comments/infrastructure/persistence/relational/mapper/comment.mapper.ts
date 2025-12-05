import { MemeEntity } from 'src/memes/infrastructure/persistence/relational/entities/meme.entity';
import { MemeMapper } from 'src/memes/infrastructure/persistence/relational/mapper/meme.mapper';
import { UserEntity } from 'src/users/infrastructure/persistence/relational/entities/user.entity';
import { UserMapper } from 'src/users/infrastructure/persistence/relational/mappers/user.mapper';
import { Comment } from '../../../../domain/comment';
import { CommentEntity } from '../entities/comment.entity';

export class CommentMapper {
  static toDomain(raw: CommentEntity): Comment {
    const comment = Object.assign(new Comment(), raw.toJSON());
    comment.id = raw.id;
    comment.content = raw.content;

    if (raw.meme) {
      comment.meme = MemeMapper.toDomain(raw.meme);
    }

    if (raw.author) {
      comment.author = UserMapper.toDomain(raw.author);
    }

    comment.parentComment = raw.parentComment
      ? CommentMapper.toDomain(raw.parentComment)
      : null;
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

    if (comment.author && comment.author?.id) {
      entity.author = { id: comment.author.id } as UserEntity;
    }

    if (comment.meme && comment.meme?.id) {
      entity.meme = { id: comment.meme.id } as MemeEntity;
    }

    entity.parentComment = comment.parentComment
      ? CommentMapper.toPersistence(comment.parentComment)
      : null;
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
