import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import slugify from 'slugify';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { FilesService } from '../files/files.service';
import {
  IFilterOptions,
  IPaginationOptions,
  ISearchOptions,
  ISortOptions,
} from '../utils/types/pagination-options';
import { Template } from './domain/template';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplateEntity } from './infrastructure/persistence/relational/entities/template.entity';
import { TemplateMapper } from './infrastructure/persistence/relational/mapper/template.mapper';
import { TemplateRepository } from './infrastructure/persistence/template.repository';

@Injectable()
export class TemplateService {
  constructor(
    private readonly templateRepository: TemplateRepository,
    private readonly filesService: FilesService,
  ) {}

  async create(createTemplateDto: CreateTemplateDto, user: JwtPayloadType) {
    const isExist = await this.templateRepository.getByTitle(
      createTemplateDto.title,
    );

    if (isExist) {
      throw new UnprocessableEntityException(
        'Template with this name already exists',
      );
    }

    const slug = slugify(createTemplateDto.title, {
      replacement: '-',
      remove: undefined,
      lower: false,
      strict: false,
      locale: 'vi',
      trim: true,
    });
    const template = await this.templateRepository.create(
      createTemplateDto,
      user,
      slug,
    );
    return TemplateMapper.toDomain(template);
  }

  async getById(templateId: string) {
    const template = await this.templateRepository.getById(templateId);
    if (!template) {
      throw new NotFoundException('Template not found with given template id');
    }
    return TemplateMapper.toDomain(template);
  }

  async getAll(options: {
    paginationOptions: IPaginationOptions;
    sortOptions: ISortOptions<TemplateEntity>;
    search?: string;
    filterOptions?: Partial<Record<keyof TemplateEntity, string>>;
  }) {
    const { paginationOptions, sortOptions, search } = options;

    const repoOptions: IPaginationOptions &
      ISortOptions<TemplateEntity> &
      IFilterOptions<TemplateEntity> &
      ISearchOptions = {
      ...paginationOptions,
      ...sortOptions,
      search,
    };

    const { items, totalItems } =
      await this.templateRepository.findManyWithPagination(repoOptions);

    return {
      items,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / paginationOptions.limit),
        currentPage: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    };
  }

  async update(
    id: string,
    updateTemplateDto: UpdateTemplateDto,
    user: JwtPayloadType,
  ): Promise<TemplateEntity> {
    const existingTemplate = await this.templateRepository.getById(id);

    if (!existingTemplate) {
      throw new NotFoundException('Template not found');
    }

    if (existingTemplate.author?.id !== user.id) {
      throw new ForbiddenException(
        'You are not allowed to update this template',
      );
    }

    let slug = existingTemplate.slug;

    if (
      updateTemplateDto?.title &&
      updateTemplateDto.title !== existingTemplate.title
    ) {
      const isExist = await this.templateRepository.getByTitle(
        updateTemplateDto.title,
      );

      if (isExist) {
        throw new UnprocessableEntityException(
          'Template with given title alreay exists',
        );
      }

      slug = slugify(updateTemplateDto.title, {
        replacement: '-',
        remove: undefined,
        lower: false,
        strict: false,
        locale: 'vi',
        trim: true,
      });
    }

    const updateData = {
      title: updateTemplateDto.title?.trim(),
      description: updateTemplateDto.description ?? undefined,
      config: updateTemplateDto.config,
      slug,
    };

    const updatedTemplate = await this.templateRepository.update(
      updateData,
      id,
    );

    return updatedTemplate;
  }

  async delete(id: Template['id']) {
    const isExist = await this.templateRepository.getById(id);
    if (!isExist) {
      throw new NotFoundException('Template not found with given template id');
    }
    await this.templateRepository.softDelete(id);
  }
}
