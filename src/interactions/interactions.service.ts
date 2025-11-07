import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { InteractionSummaryDto } from './dto/interaction-summary.dto';
import { MemeInteractionRepository } from './infrastructure/persistence/meme-interaction.repository';
import { InteractionType } from './interactions.enum';

@Injectable()
export class InteractionsService {
  constructor(
    private readonly interactionRepository: MemeInteractionRepository,
  ) {}

  async createInteraction(
    createInteractionDto: CreateInteractionDto,
    userId: string,
  ) {
    const { memeId, type, reason, note } = createInteractionDto;

    // Check if interaction already exists
    const existing = await this.interactionRepository.findOne(
      memeId,
      userId,
      type,
    );

    if (existing) {
      throw new BadRequestException(
        `You have already ${type.toLowerCase()}d this meme`,
      );
    }

    // If upvoting, remove downvote if exists
    if (type === InteractionType.UPVOTE) {
      await this.interactionRepository.removeByMemeAndUser(
        memeId,
        userId,
        InteractionType.DOWNVOTE,
      );
    }

    // If downvoting, remove upvote if exists
    if (type === InteractionType.DOWNVOTE) {
      await this.interactionRepository.removeByMemeAndUser(
        memeId,
        userId,
        InteractionType.UPVOTE,
      );
    }

    // Validate report/flag requirements
    if (
      (type === InteractionType.REPORT || type === InteractionType.FLAG) &&
      !reason &&
      !note
    ) {
      throw new BadRequestException(
        'Reason or note is required for reports and flags',
      );
    }

    return this.interactionRepository.create({
      meme: { id: memeId } as any,
      user: { id: userId } as any,
      type,
      reason: reason ?? null,
      note: note ?? null,
    } as any);
  }

  async removeInteraction(
    memeId: string,
    userId: string,
    type: InteractionType,
  ) {
    const interaction = await this.interactionRepository.findOne(
      memeId,
      userId,
      type,
    );

    if (!interaction) {
      throw new NotFoundException('Interaction not found');
    }

    await this.interactionRepository.removeByMemeAndUser(memeId, userId, type);
  }

  async getMemeInteractions(
    memeId: string,
    userId?: string,
  ): Promise<InteractionSummaryDto> {
    return this.interactionRepository.getSummary(memeId, userId);
  }

  async getUserInteractions(userId: string) {
    return this.interactionRepository.findByUser(userId);
  }
}
