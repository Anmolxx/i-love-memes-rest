import { MemeInteraction } from 'src/interactions/domain/meme-interaction';
import { InteractionType } from 'src/interactions/interactions.enum';
import { NullableType } from 'src/utils/types/nullable.type';

export abstract class MemeInteractionRepository {
  abstract create(
    data: Omit<MemeInteraction, 'id' | 'createdAt'>,
  ): Promise<MemeInteraction>;

  abstract findOne(
    memeId: string,
    userId: string,
    type: InteractionType,
  ): Promise<NullableType<MemeInteraction>>;

  abstract findByMeme(memeId: string): Promise<MemeInteraction[]>;

  abstract findByUser(userId: string): Promise<MemeInteraction[]>;

  abstract remove(id: string): Promise<void>;

  abstract removeByMemeAndUser(
    memeId: string,
    userId: string,
    type: InteractionType,
  ): Promise<void>;

  abstract countByMemeAndType(
    memeId: string,
    type: InteractionType,
  ): Promise<number>;

  abstract getSummary(
    memeId: string,
    userId?: string,
  ): Promise<{
    upvoteCount: number;
    downvoteCount: number;
    reportCount: number;
    flagCount: number;
    netScore: number;
    userInteraction?: { type: string; createdAt: Date };
  }>;
}
