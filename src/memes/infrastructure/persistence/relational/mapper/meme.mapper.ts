import { UserEntity } from 'src/users/infrastructure/persistence/relational/entities/user.entity';
import { FileMapper } from '../../../../../files/infrastructure/persistence/relational/mappers/file.mapper';
import { TemplateEntity } from '../../../../../templates/infrastructure/persistence/relational/entities/template.entity';
import { Meme } from '../../../../domain/meme';
import { MemeEntity } from '../entities/meme.entity';

export class MemeMapper {
  static toDomain(raw: MemeEntity): Meme {
    const domain = new Meme();
    domain.id = raw.id;
    domain.title = raw.title;
    domain.slug = raw.slug;
    domain.description = raw.description;

    if (raw.template) {
      domain.template = {
        id: raw.template.id,
        slug: raw.template.slug,
        title: raw.template.title,
      };
    }

    if (raw.file) {
      domain.file = FileMapper.toDomain(raw.file);
    }

    if (raw.author) {
      domain.author = {
        id: raw.author.id,
        email: raw.author.email,
      } as any;
    }

    domain.audience = raw.audience;
    domain.createdAt = raw.createdAt;
    domain.updatedAt = raw.updatedAt;
    domain.deletedAt = raw.deletedAt;
    return domain;
  }

  static toPersistence(domain: Meme): MemeEntity {
    const persistence = new MemeEntity();
    if (domain.id) persistence.id = domain.id;
    persistence.title = domain.title;
    persistence.slug = domain.slug;
    persistence.description = domain.description as any;

    if (domain.template?.id) {
      const t = new TemplateEntity();
      t.id = domain.template.id;
      persistence.template = t;
    }

    if (domain.file) {
      persistence.file = FileMapper.toPersistence(domain.file as any);
    }

    if (domain.author) {
      const u: Partial<UserEntity> = {};
      if (domain.author.id) u.id = domain.author.id;
      persistence.author = u as UserEntity;
    }

    persistence.audience = domain.audience;
    persistence.createdAt = domain.createdAt;
    persistence.updatedAt = domain.updatedAt;
    persistence.deletedAt = domain.deletedAt;
    return persistence;
  }
}
