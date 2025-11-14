import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MemeInteraction } from 'src/interactions/domain/meme-interaction';
import {
  InteractionSummaryDto,
  UserInteractionDto,
} from 'src/interactions/dto/interaction-summary.dto';
import { MemeInteractionRepository } from 'src/interactions/infrastructure/persistence/meme-interaction.repository';
import { InteractionType } from 'src/interactions/interactions.enum';
import { NullableType } from 'src/utils/types/nullable.type';
import { Repository } from 'typeorm';

import { MemeInteractionEntity } from '../entities/meme-interaction.entity';
import { MemeInteractionMapper } from '../mapper/meme-interaction.mapper';

@Injectable()
export class MemeInteractionRelationalRepository
  implements MemeInteractionRepository
{
  constructor(
    @InjectRepository(MemeInteractionEntity)
    private readonly interactionRepository: Repository<MemeInteractionEntity>,
  ) {}

  async create(
    data: Omit<MemeInteraction, 'id' | 'createdAt'>,
  ): Promise<MemeInteraction> {
    const persistenceModel = MemeInteractionMapper.toPersistence(
      data as MemeInteraction,
    );
    const newEntity = await this.interactionRepository.save(
      this.interactionRepository.create(persistenceModel),
    );
    return MemeInteractionMapper.toDomain(newEntity);
  }

  async findOne(
    memeId: string,
    userId: string,
    type: InteractionType,
  ): Promise<NullableType<MemeInteraction>> {
    const entity = await this.interactionRepository.findOne({
      where: {
        meme: { id: memeId },
        user: { id: userId },
        type,
      },
      relations: ['meme', 'user'],
    });

    return entity ? MemeInteractionMapper.toDomain(entity) : null;
  }

  async findByMeme(memeId: string): Promise<MemeInteraction[]> {
    const entities = await this.interactionRepository.find({
      where: { meme: { id: memeId } },
      relations: ['meme', 'user'],
    });

    return entities.map((entity) => MemeInteractionMapper.toDomain(entity));
  }

  async findByUser(userId: string): Promise<MemeInteraction[]> {
    const entities = await this.interactionRepository.find({
      where: { user: { id: userId } },
      relations: ['meme', 'user'],
    });

    return entities.map((entity) => MemeInteractionMapper.toDomain(entity));
  }

  async remove(id: string): Promise<void> {
    await this.interactionRepository.delete(id);
  }

  async removeByMemeAndUser(
    memeId: string,
    userId: string,
    type: InteractionType,
  ): Promise<void> {
    await this.interactionRepository.delete({
      meme: { id: memeId },
      user: { id: userId },
      type,
    });
  }

  async countByMemeAndType(
    memeId: string,
    type: InteractionType,
  ): Promise<number> {
    return this.interactionRepository.count({
      where: {
        meme: { id: memeId },
        type,
      },
    });
  }

  async getSummary(
    memeId: string,
    userId?: string,
  ): Promise<InteractionSummaryDto> {
    const upvoteCount = await this.countByMemeAndType(
      memeId,
      InteractionType.UPVOTE,
    );
    const downvoteCount = await this.countByMemeAndType(
      memeId,
      InteractionType.DOWNVOTE,
    );
    const reportCount = await this.countByMemeAndType(
      memeId,
      InteractionType.REPORT,
    );
    const flagCount = await this.countByMemeAndType(
      memeId,
      InteractionType.FLAG,
    );

    const netScore = upvoteCount - downvoteCount;

    const summary: InteractionSummaryDto = {
      upvoteCount,
      downvoteCount,
      reportCount,
      flagCount,
      netScore,
    };

    if (userId) {
      const userInteractions = await this.interactionRepository.find({
        where: {
          meme: { id: memeId },
          user: { id: userId },
        },
        order: { createdAt: 'DESC' },
      });

      if (userInteractions.length > 0) {
        summary.userInteractions = userInteractions.map(
          (interaction) =>
            ({
              type: interaction.type,
              createdAt: interaction.createdAt,
              reason: interaction.reason,
              note: interaction.note,
            }) as UserInteractionDto,
        );
      }
    }

    return summary;
  }
}
