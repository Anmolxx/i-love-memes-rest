import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MemesRepository } from './infrastructure/persistence/meme.repository';
import { Meme } from './domain/meme';
import { CreateMemeDto } from './dto/create-meme.dto';
import { UpdateMemeDto } from './dto/update-meme.dto';
import { FilesService } from '../files/files.service';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { User } from '../users/domain/user';
import { FileType } from '../files/domain/file';
import { FileStatus } from '../files/file.enum';

@Injectable()
export class MemesService {
  constructor(
    private readonly memesRepository: MemesRepository,
    private readonly filesService: FilesService,
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

    const baseSlug = (createMemeDto.title || '')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const slug = baseSlug;

    const meme: Partial<Meme> = {
      title: createMemeDto.title,
      slug,
      description: createMemeDto.description ?? undefined,
      file,
      audience: createMemeDto.audience,
      author: { id: user.id },
    };

    return this.memesRepository.create(meme as Meme);
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: any | null;
    sortOptions?: {
      orderBy: string;
      order: 'ASC' | 'DESC';
    };
    paginationOptions: IPaginationOptions;
  }): Promise<{ data: Meme[]; total: number }> {
    return this.memesRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  findById(id: Meme['id']): Promise<Meme | null> {
    return this.memesRepository.findById(id);
  }

  async update(id: Meme['id'], updateMemeDto: UpdateMemeDto, user: User) {
    const existingMeme = await this.memesRepository.findById(id);
    if (!existingMeme) {
      throw new NotFoundException('Meme Not Found');
    }

    if (existingMeme.author.id !== user.id) {
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
      const baseSlug = (updateMemeDto.title || '')
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      slug = baseSlug;
    }

    return this.memesRepository.update(id, {
      title: updateMemeDto.title,
      slug,
      description: updateMemeDto.description ?? undefined,
      file,
      audience: updateMemeDto.audience,
    } as Meme);
  }

  async remove(id: Meme['id'], user: User): Promise<void> {
    const meme = await this.memesRepository.findById(id);
    if (!meme) {
      throw new NotFoundException();
    }

    const isOwner = meme.author.id === user.id;
    const isAdmin = user.role?.name === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You are not allowed to delete this Meme');
    }

    await this.filesService.updateStatus(meme.file.id, FileStatus.TEMPORARY);

    await this.memesRepository.remove(id);
  }

  async findMyMemes(user: User): Promise<Meme[]> {
    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    return this.memesRepository.findByAuthorId(user.id);
  }
}
