import { MemeInteraction } from '../../../../domain/meme-interaction';
import { MemeInteractionEntity } from '../entities/meme-interaction.entity';

export class MemeInteractionMapper {
  static toDomain(raw: MemeInteractionEntity): MemeInteraction {
    const interaction = new MemeInteraction();
    interaction.id = raw.id;
    interaction.meme = raw.meme;
    interaction.user = raw.user;
    interaction.type = raw.type;
    interaction.reason = raw.reason;
    interaction.note = raw.note;
    interaction.createdAt = raw.createdAt;
    return interaction;
  }

  static toPersistence(interaction: MemeInteraction): MemeInteractionEntity {
    const entity = new MemeInteractionEntity();
    if (interaction.id) {
      entity.id = interaction.id;
    }
    entity.meme = interaction.meme;
    entity.user = interaction.user;
    entity.type = interaction.type as any;
    entity.reason = (interaction.reason as any) ?? null;
    entity.note = interaction.note ?? null;
    entity.createdAt = interaction.createdAt;
    return entity;
  }
}
