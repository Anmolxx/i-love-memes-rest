import { Tag } from 'src/tags/domain/tag';
import { fromStringToTagStatus } from 'src/tags/tags.enum';
import { TagEntity } from '../entities/tag.entity';

export class TagMapper {
  static toDomain(raw: TagEntity): Tag {
    const tag = new Tag();
    tag.id = raw.id;
    tag.name = raw.name;
    tag.normalizedName = raw.normalizedName;
    tag.slug = raw.slug;
    tag.category = raw.category;
    tag.description = raw.description;
    tag.usageCount = raw.usageCount;
    tag.status = raw.status;
    tag.createdAt = raw.createdAt;
    tag.updatedAt = raw.updatedAt;
    tag.deletedAt = raw.deletedAt;
    return tag;
  }

  static toPersistence(tag: Tag): TagEntity {
    const tagEntity = new TagEntity();
    if (tag.id) {
      tagEntity.id = tag.id;
    }
    tagEntity.name = tag.name;
    tagEntity.normalizedName = tag.normalizedName;
    tagEntity.slug = tag.slug;
    tagEntity.category = tag.category ?? null;
    tagEntity.description = tag.description ?? null;
    tagEntity.usageCount = tag.usageCount;
    tagEntity.status = fromStringToTagStatus(tag.status);
    tagEntity.createdAt = tag.createdAt;
    tagEntity.updatedAt = tag.updatedAt;
    if (tag.deletedAt) {
      tagEntity.deletedAt = tag.deletedAt;
    }
    return tagEntity;
  }
}
