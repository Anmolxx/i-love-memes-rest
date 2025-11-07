import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MemesRepository } from 'src/memes/infrastructure/persistence/meme.repository';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { InteractionSummaryDto } from './dto/interaction-summary.dto';
import { MemeInteractionRepository } from './infrastructure/persistence/meme-interaction.repository';
import { InteractionType } from './interactions.enum';

@Injectable()
export class InteractionsService {
  constructor(
    private readonly interactionRepository: MemeInteractionRepository,
    private readonly memeRepository: MemesRepository,
  ) {}

  async createInteraction(
    createInteractionDto: CreateInteractionDto,
    userId: string,
  ) {
    const { memeId: memeSlugOrId, type, reason, note } = createInteractionDto;

    // Resolve meme slug to ID
    let meme = await this.memeRepository.findBySlug(memeSlugOrId);
    if (!meme) {
      meme = await this.memeRepository.findById(memeSlugOrId);
    }
    if (!meme) {
      throw new NotFoundException(
        `Meme with identifier ${memeSlugOrId} not found`,
      );
    }

    // Check if interaction already exists
    const existing = await this.interactionRepository.findOne(
      meme.id,
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
        meme.id,
        userId,
        InteractionType.DOWNVOTE,
      );
    }

    // If downvoting, remove upvote if exists
    if (type === InteractionType.DOWNVOTE) {
      await this.interactionRepository.removeByMemeAndUser(
        meme.id,
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
      meme: { id: meme.id } as any,
      user: { id: userId } as any,
      type,
      reason: reason ?? null,
      note: note ?? null,
    } as any);
  }

  async removeInteraction(
    memeSlugOrId: string,
    userId: string,
    type: InteractionType,
  ) {
    // Resolve meme slug to ID
    let meme = await this.memeRepository.findBySlug(memeSlugOrId);
    if (!meme) {
      meme = await this.memeRepository.findById(memeSlugOrId);
    }
    if (!meme) {
      throw new NotFoundException(
        `Meme with identifier ${memeSlugOrId} not found`,
      );
    }

    const interaction = await this.interactionRepository.findOne(
      meme.id,
      userId,
      type,
    );

    if (!interaction) {
      throw new NotFoundException('Interaction not found');
    }

    await this.interactionRepository.removeByMemeAndUser(meme.id, userId, type);
  }

  async getMemeInteractions(
    memeSlugOrId: string,
    userId?: string,
  ): Promise<InteractionSummaryDto> {
    // Resolve meme slug to ID
    let meme = await this.memeRepository.findBySlug(memeSlugOrId);
    if (!meme) {
      meme = await this.memeRepository.findById(memeSlugOrId);
    }
    if (!meme) {
      throw new NotFoundException(
        `Meme with identifier ${memeSlugOrId} not found`,
      );
    }

    return this.interactionRepository.getSummary(meme.id, userId);
  }

  async getUserInteractions(userId: string) {
    return this.interactionRepository.findByUser(userId);
  }
}
