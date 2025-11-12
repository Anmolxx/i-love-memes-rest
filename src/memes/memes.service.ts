import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  MemeFilterOptionsDto,
  MemeSortOptionsDto,
} from 'src/memes/dto/meme-filter-options.dto';
import { TagRepository } from 'src/tags/infrastructure/persistence/tag.repository';
import { FileType } from '../files/domain/file';
import { FileStatus } from '../files/file.enum';
import { FilesService } from '../files/files.service';
import { TagsService } from '../tags/tags.service';
import { User } from '../users/domain/user';
import { PaginationMetaDto } from '../utils/dto/pagination-response.dto';
import {
  generateBaseSlug,
  generateUniqueSlug,
  isUUID,
} from '../utils/slug.util';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Meme } from './domain/meme';
import { CreateMemeDto } from './dto/create-meme.dto';
import { UpdateMemeDto } from './dto/update-meme.dto';
import { MemesRepository } from './infrastructure/persistence/meme.repository';

@Injectable()
export class MemesService {
  constructor(
    private readonly memesRepository: MemesRepository,
    private readonly filesService: FilesService,
    private readonly tagsService: TagsService,
    private readonly tagRepository: TagRepository,
  ) {}

  async create(createMemeDto: CreateMemeDto, user: User): Promise<Meme> {
    let file: FileType | undefined = undefined;

    if (!user || !user.id) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { auth: 'userNotAuthenticated' },
      });
    }

    const existing = await this.memesRepository.findByTitle(
      createMemeDto.title,
    );

    if (existing) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          title: 'titleAlreadyExists',
        },
      });
    }

    if (createMemeDto.file?.id) {
      const fileObject = await this.filesService.findById(
        createMemeDto.file.id,
      );
      if (!fileObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            file: 'imageNotExists',
          },
        });
      }

      if (fileObject.status !== FileStatus.TEMPORARY) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            file: 'fileAlreadyLinked',
          },
        });
      }
      await this.filesService.updateStatus(fileObject.id, FileStatus.PERMANENT);
      file = fileObject;
    }

    // Automated unique slug generation
    const baseSlug = generateBaseSlug(createMemeDto.title);
    const slug = await generateUniqueSlug(baseSlug, async (slug) => {
      const found = await this.memesRepository.findBySlug(slug);
      return !!found;
    });

    const meme: Partial<Meme> = {
      title: createMemeDto.title,
      slug,
      description: createMemeDto.description ?? undefined,
      file,
      audience: createMemeDto.audience,
      author: { id: user.id },
      template: { id: createMemeDto.templateId },
    };
    const createdMeme = await this.memesRepository.create(meme as Meme);
    // Handle tags
    if (createMemeDto.tags && createMemeDto.tags.length > 0) {
      const tags = await this.tagsService.findOrCreate({
        names: createMemeDto.tags,
      });
      for (const tag of tags) {
        await this.tagRepository.linkTagToMeme(createdMeme.id, tag.id);
      }
    }
    return createdMeme;
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: MemeFilterOptionsDto | null;
    sortOptions?: MemeSortOptionsDto;
    paginationOptions: IPaginationOptions;
  }): Promise<{ items: Meme[]; meta: PaginationMetaDto }> {
    return this.memesRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  findById(id: Meme['id']): Promise<Meme | null> {
    return this.memesRepository.findById(id);
  }

  async findOne(slugOrId: string): Promise<Meme> {
    // Try to find by slug first (more user-friendly)
    let meme = await this.memesRepository.findBySlug(slugOrId);

    // If not found by slug, try by ID
    if (!meme && isUUID(slugOrId)) {
      meme = await this.memesRepository.findById(slugOrId);
    }

    if (!meme) {
      throw new NotFoundException(`Meme with identifier ${slugOrId} not found`);
    }

    return meme;
  }

  async update(slugOrId: string, updateMemeDto: UpdateMemeDto, user: User) {
    // Try to find by slug first
    let existingMeme = await this.memesRepository.findBySlug(slugOrId);

    // If not found by slug, try by ID
    if (!existingMeme && isUUID(slugOrId)) {
      existingMeme = await this.memesRepository.findById(slugOrId);
    }

    if (!existingMeme) {
      throw new NotFoundException('Meme Not Found');
    }

    if (existingMeme.author?.id !== user.id) {
      throw new ForbiddenException('You are not allowed to update this Meme');
    }

    let file: FileType | null | undefined = undefined;

    if (updateMemeDto.title) {
      const isExist = await this.memesRepository.findByTitle(
        updateMemeDto.title,
      );
      if (isExist && isExist.id !== existingMeme.id) {
        throw new UnprocessableEntityException(
          'Meme with this title already Exists',
        );
      }
    }

    if (
      updateMemeDto.file?.id &&
      existingMeme.file.id !== updateMemeDto.file.id
    ) {
      const fileObject = await this.filesService.findById(
        updateMemeDto.file.id,
      );
      if (!fileObject) {
        throw new UnprocessableEntityException('Incorrect File Id');
      }
      if (fileObject.status !== FileStatus.TEMPORARY) {
        throw new UnprocessableEntityException(
          'file Already Linked with another Meme',
        );
      }

      await this.filesService.updateStatus(fileObject.id, FileStatus.PERMANENT);
      await this.filesService.updateStatus(
        existingMeme.id,
        FileStatus.TEMPORARY,
      );
      file = fileObject;
    }

    let slug: string | undefined = undefined;
    if (updateMemeDto.title) {
      const baseSlug = generateBaseSlug(updateMemeDto.title);
      slug = await generateUniqueSlug(baseSlug, async (slug) => {
        const found = await this.memesRepository.findBySlug(slug);
        // Allow current meme's slug
        return !!found && found.id !== existingMeme.id;
      });
    }
    const updatedMeme = await this.memesRepository.update(existingMeme.id, {
      title: updateMemeDto.title,
      slug,
      description: updateMemeDto.description ?? undefined,
      file,
      audience: updateMemeDto.audience,
    } as Meme);
    // Handle tags
    if (updateMemeDto.tags) {
      // Remove old tags
      // You should implement a method in TagRepository to remove all links for a meme if needed
      // For now, assume such a method exists: removeAllTagLinksForMeme(memeId)
      if (typeof this.tagRepository.removeAllTagLinksForMeme === 'function') {
        await this.tagRepository.removeAllTagLinksForMeme(existingMeme.id);
      }
      if (updateMemeDto.tags.length > 0) {
        const tags = await this.tagsService.findOrCreate({
          names: updateMemeDto.tags,
        });
        for (const tag of tags) {
          await this.tagRepository.linkTagToMeme(existingMeme.id, tag.id);
        }
      }
    }
    return updatedMeme;
  }

  async remove(slugOrId: string, user: User): Promise<void> {
    // Try to find by slug first
    let meme = await this.memesRepository.findBySlug(slugOrId);

    // If not found by slug, try by ID
    if (!meme && isUUID(slugOrId)) {
      meme = await this.memesRepository.findById(slugOrId);
    }

    if (!meme) {
      throw new NotFoundException();
    }

    const isOwner = meme.author?.id === user.id;
    const isAdmin = user.role?.name === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You are not allowed to delete this Meme');
    }

    await this.filesService.updateStatus(meme.file.id, FileStatus.TEMPORARY);

    await this.memesRepository.remove(meme.id);
  }

  async findMyMemes(
    user: User,
    {
      filterOptions,
      sortOptions,
      paginationOptions,
    }: {
      filterOptions?: MemeFilterOptionsDto | null;
      sortOptions?: MemeSortOptionsDto;
      paginationOptions?: IPaginationOptions;
    } = { paginationOptions: { page: 1, limit: 10 } },
  ): Promise<{ items: Meme[]; meta: PaginationMetaDto }> {
    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    const effectivePagination = paginationOptions ?? { page: 1, limit: 10 };

    return this.memesRepository.findByAuthorId(user.id, {
      filterOptions,
      sortOptions,
      paginationOptions: effectivePagination,
    });
  }
}
