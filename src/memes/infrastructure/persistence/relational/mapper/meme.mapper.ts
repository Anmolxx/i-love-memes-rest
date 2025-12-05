import { FileMapper } from 'src/files/infrastructure/persistence/relational/mappers/file.mapper';
import { Meme } from 'src/memes/domain/meme';
import { TagMapper } from 'src/tags/infrastructure/persistence/relational/mapper/tag.mapper';
import { TemplateEntity } from 'src/templates/infrastructure/persistence/relational/entities/template.entity';
import { TemplateMapper } from 'src/templates/infrastructure/persistence/relational/mapper/template.mapper';
import { UserEntity } from 'src/users/infrastructure/persistence/relational/entities/user.entity';
import { UserMapper } from 'src/users/infrastructure/persistence/relational/mappers/user.mapper';
import { MemeEntity } from '../entities/meme.entity';

export class MemeMapper {
  static toDomain(raw: MemeEntity): Meme {
    const domain = new Meme();
    domain.id = raw.id;
    domain.title = raw.title;
    domain.slug = raw.slug;
    domain.description = raw.description;

    if (raw.template) {
      domain.template = TemplateMapper.toDomain(raw.template);
    }

    if (raw.file) {
      domain.file = FileMapper.toDomain(raw.file);
    }

    if (raw.author) {
      domain.author = UserMapper.toDomain(raw.author);
    }

    domain.audience = raw.audience;
    domain.createdAt = raw.createdAt;
    domain.updatedAt = raw.updatedAt;
    domain.deletedAt = raw.deletedAt;

    if (raw.tags) {
      domain.tags = raw.tags.map((t) => TagMapper.toDomain(t));
    }

    // Map computed interaction counts if present on the raw entity (selected via query builder)
    const upvoteCount = (raw as any)['interaction_upvote_count'];
    const downvoteCount = (raw as any)['interaction_downvote_count'];
    const reportCount = (raw as any)['interaction_report_count'];
    const flagCount = (raw as any)['interaction_flag_count'];
    const netScore = (raw as any)['interaction_net_score'];
    const calculated_score = (raw as any)['calculated_score'];
    const userInteractions = (raw as any)['user_interactions'];

    let parsedUserInteractions: any = userInteractions;
    // If the DB returned the user_interactions cast to TEXT, it will be a JSON string
    if (typeof userInteractions === 'string') {
      try {
        parsedUserInteractions = JSON.parse(userInteractions);
      } catch (e) {
        // If parsing fails, default to empty array to avoid crashes
        parsedUserInteractions = [];
        console.error(e);
      }
    }

    if (
      typeof upvoteCount !== 'undefined' ||
      typeof downvoteCount !== 'undefined' ||
      typeof reportCount !== 'undefined' ||
      typeof flagCount !== 'undefined' ||
      typeof netScore !== 'undefined' ||
      typeof calculated_score !== 'undefined'
    ) {
      const computedNet = Number(upvoteCount ?? 0) - Number(downvoteCount ?? 0);
      domain.interactionSummary = {
        upvoteCount: Number(upvoteCount ?? 0),
        downvoteCount: Number(downvoteCount ?? 0),
        reportCount: Number(reportCount ?? 0),
        flagCount: Number(flagCount ?? 0),
        netScore:
          typeof netScore !== 'undefined' ? Number(netScore) : computedNet,
        calculatedScore:
          typeof calculated_score !== 'undefined'
            ? Number(calculated_score)
            : undefined,
      } as any;

      // Add user interactions array if present and not empty
      if (
        userInteractions &&
        domain.interactionSummary &&
        Array.isArray(parsedUserInteractions) &&
        parsedUserInteractions.length > 0
      ) {
        domain.interactionSummary.userInteractions = parsedUserInteractions.map(
          (interaction: any) => ({
            type: interaction.type,
            createdAt: new Date(interaction.createdAt),
            reason: interaction.reason,
            note: interaction.note,
          }),
        );
      }
    }

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
