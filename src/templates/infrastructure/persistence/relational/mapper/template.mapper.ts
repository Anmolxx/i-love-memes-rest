import { TagMapper } from 'src/tags/infrastructure/persistence/relational/mapper/tag.mapper';
import { Template } from '../../../../domain/template';
import { TemplateEntity } from '../entities/template.entity';

export class TemplateMapper {
  static toDomain(raw: TemplateEntity) {
    const domain = new Template();
    domain.id = raw.id;
    domain.title = raw.title;
    domain.slug = raw.slug;
    domain.description = raw.description;
    domain.config = raw.config;

    if (raw.author) {
      domain.author = {
        id: raw.author.id,
        email: raw.author.email,
      } as any;
    }

    if (raw.tags) {
      domain.tags = raw.tags.map((t) => TagMapper.toDomain(t));
    }

    domain.createdAt = raw.createdAt;
    domain.updatedAt = raw.updatedAt;
    domain.deletedAt = raw.deletedAt;
    return domain;
  }

  static toPersistence(domain: Template): TemplateEntity {
    const persistence = new TemplateEntity();
    if (domain.id) persistence.id = domain.id;
    persistence.title = domain.title;
    persistence.description = domain.description ?? undefined;
    persistence.config = domain.config;
    return persistence;
  }
}
