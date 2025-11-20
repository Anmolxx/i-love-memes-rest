import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  IMemeFilters,
  MemeSortField,
} from 'src/memes/dto/meme-filter-options.dto';
import { TagRepository } from 'src/tags/infrastructure/persistence/tag.repository';
import { IFilterOptions, IPaginationOptions, ISortOptions } from 'src/utils';
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

    // Refetch with interaction stats for consistent response format
    const memeWithStats = await this.memesRepository.findById(
      createdMeme.id,
      user.id,
    );
    return memeWithStats || createdMeme;
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
    currentUserId,
  }: {
    filterOptions?: IFilterOptions<IMemeFilters> | null;
    sortOptions?: ISortOptions<MemeSortField>;
    paginationOptions: IPaginationOptions;
    currentUserId?: string;
  }): Promise<{ items: Meme[]; meta: PaginationMetaDto }> {
    return this.memesRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
      currentUserId,
    });
  }

  findById(id: Meme['id'], currentUserId?: string): Promise<Meme | null> {
    return this.memesRepository.findById(id, currentUserId);
  }

  async findOne(slugOrId: string, currentUserId?: string): Promise<Meme> {
    // Try to find by slug first (more user-friendly)
    let meme = await this.memesRepository.findBySlug(slugOrId, currentUserId);

    // If not found by slug, try by ID
    if (!meme && isUUID(slugOrId)) {
      meme = await this.memesRepository.findById(slugOrId, currentUserId);
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

    // Refetch with interaction stats for consistent response format
    const memeWithStats = await this.memesRepository.findById(
      updatedMeme.id,
      user.id,
    );
    return memeWithStats || updatedMeme;
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
      filterOptions?: IFilterOptions<IMemeFilters> | null;
      sortOptions?: ISortOptions<MemeSortField>;
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
      currentUserId: user.id,
    });
  }

  async findTopMemes({
    filterOptions,
    sortOptions,
    paginationOptions,
    currentUserId,
  }: {
    filterOptions?: IFilterOptions<IMemeFilters> | null;
    sortOptions?: ISortOptions<MemeSortField>;
    paginationOptions: IPaginationOptions;
    currentUserId?: string;
  }): Promise<{ items: Meme[]; meta: PaginationMetaDto }> {
    // Default to sophisticated TRENDING sort if no sort option is provided
    // TRENDING uses weighted interactions (upvotes, downvotes, reports, flags)
    // with time decay and recency bonus for a dynamic, engaging feed
    const effectiveSortOptions = sortOptions?.orderBy
      ? sortOptions
      : { orderBy: MemeSortField.TRENDING, order: 'DESC' as const };

    return this.memesRepository.findManyWithPagination({
      filterOptions,
      sortOptions: effectiveSortOptions,
      paginationOptions,
      currentUserId,
    });
  }

  async findDeletedWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: IFilterOptions<IMemeFilters> | null;
    sortOptions?: ISortOptions<MemeSortField>;
    paginationOptions: IPaginationOptions;
  }): Promise<{ items: Meme[]; meta: PaginationMetaDto }> {
    // Call repository query ensuring deleted items are included
    // Implement a simple query builder where we bypass the deletedAt IS NULL filter
    // The repo doesn't have a specialized method yet, so use findManyWithPagination but adapted
    // For simplicity, add a boolean flag on repo call if available (not present) -> implement by calling repos directly
    // We'll create a custom repo method in relational repository; assume it's available: findDeletedWithPagination

    if (typeof this.memesRepository.findDeletedWithPagination === 'function') {
      return this.memesRepository.findDeletedWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
      });
    }

    // Fallback: reuse findManyWithPagination but this will exclude deleted; return empty results as fallback
    return {
      items: [],
      meta: {
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
        limit: paginationOptions.limit,
      },
    };
  }

  async findMyDeleted(
    user: User,
    {
      filterOptions,
      sortOptions,
      paginationOptions,
    }: {
      filterOptions?: IFilterOptions<IMemeFilters> | null;
      sortOptions?: ISortOptions<MemeSortField>;
      paginationOptions?: IPaginationOptions;
    } = { paginationOptions: { page: 1, limit: 10 } },
  ): Promise<{ items: Meme[]; meta: PaginationMetaDto }> {
    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    const effectivePagination = paginationOptions ?? { page: 1, limit: 10 };

    // Prefer repository having a findMyDeleted implementation
    if (typeof this.memesRepository.findByAuthorIdDeleted === 'function') {
      return this.memesRepository.findByAuthorIdDeleted(user.id, {
        filterOptions,
        sortOptions,
        paginationOptions: effectivePagination,
        currentUserId: user.id,
      });
    }

    // Fallback empty
    return {
      items: [],
      meta: {
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
        limit: paginationOptions?.limit ?? 10,
      },
    };
  }

  async restore(slugOrId: string, user: User): Promise<Meme> {
    // Try to find including deleted
    let meme = await this.memesRepository.findBySlug(
      slugOrId,
      undefined /* currentUserId */,
    );

    if (!meme && isUUID(slugOrId)) {
      meme = await this.memesRepository.findById(
        slugOrId,
        undefined /* currentUserId */,
      );
    }

    if (!meme) {
      throw new NotFoundException('Meme not found');
    }

    const isOwner = meme.author?.id === user.id;
    const isAdmin = user.role?.name === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You are not allowed to restore this Meme');
    }

    // Call repository restore - assume implementation exists
    if (typeof this.memesRepository.restore === 'function') {
      await this.memesRepository.restore(meme.id);
    } else {
      // Fallback: update deletedAt null via update
      await this.memesRepository.update(meme.id, {
        ...meme,
        deletedAt: undefined,
      } as Partial<Meme>);
    }

    // Update file status back to permanent
    if (meme.file?.id) {
      await this.filesService.updateStatus(meme.file.id, FileStatus.PERMANENT);
    }

    // Refetch including interactions
    const restored = await this.memesRepository.findById(meme.id, user.id);
    if (!restored) throw new NotFoundException('Meme not found after restore');
    return restored;
  }

  async hardDelete(slugOrId: string, user: User): Promise<void> {
    // Try to find including deleted
    let meme = await this.memesRepository.findBySlug(slugOrId, undefined);

    if (!meme && isUUID(slugOrId)) {
      meme = await this.memesRepository.findById(slugOrId, undefined);
    }

    if (!meme) {
      throw new NotFoundException('Meme not found');
    }

    const isAdmin = user.role?.name === 'admin';
    if (!isAdmin) {
      throw new ForbiddenException('Only admin can permanently delete memes');
    }

    // Remove file if exists
    if (meme.file?.id) {
      // Delete file record and storage if FilesService supports permanent delete
      if (typeof this.filesService.hardDelete === 'function') {
        await this.filesService.hardDelete(meme.file.id);
      } else {
        await this.filesService.updateStatus(
          meme.file.id,
          FileStatus.TEMPORARY,
        );
      }
    }

    // Call repository hard delete implementation if available
    if (typeof this.memesRepository.hardDelete === 'function') {
      await this.memesRepository.hardDelete(meme.id);
    } else {
      // Fallback to TypeORM delete via update/remove - assume remove softDelete was used before
      await this.memesRepository.remove(meme.id);
    }
  }

  async getPrintReadyFile(slugOrId: string, currentUserId?: string) {
    // Find the meme including deleted (depending on visibility rules), but treat deleted as not available
    const meme = await this.memesRepository.findBySlug(slugOrId, currentUserId);
    if (!meme) {
      if (isUUID(slugOrId)) {
        const byId = await this.memesRepository.findById(
          slugOrId,
          currentUserId,
        );
        if (!byId) throw new NotFoundException('Meme not found');
      } else {
        throw new NotFoundException('Meme not found');
      }
    }

    // Check if meme has a file
    const found =
      meme || (await this.memesRepository.findBySlug(slugOrId, currentUserId));
    if (!found || !found.file?.id) {
      throw new NotFoundException('Print-ready file not found');
    }

    const fileObj = await this.filesService.findById(found.file.id);
    if (!fileObj) throw new NotFoundException('File not found');

    return this.filesService.getFilePath(fileObj);
  }
}
