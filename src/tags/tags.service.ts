import { Injectable, NotFoundException } from '@nestjs/common';
import { Tag } from './domain/tag';
import { CreateTagDto } from './dto/create-tag.dto';
import { FindOrCreateTagsDto } from './dto/find-or-create-tags.dto';
import { QueryTagDto } from './dto/query-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagRepository } from './infrastructure/persistence/tag.repository';
import { TagStatus } from './tags.enum';

@Injectable()
export class TagsService {
  constructor(private readonly tagRepository: TagRepository) {}

  async create(createTagDto: CreateTagDto): Promise<Tag> {
    const { normalized, slug } = this.normalizeTagName(createTagDto.name);

    // Check if tag already exists
    const existingTag =
      await this.tagRepository.findByNormalizedName(normalized);
    if (existingTag) {
      return existingTag;
    }

    const tag = await this.tagRepository.create({
      name: createTagDto.name,
      normalizedName: normalized,
      slug,
      category: createTagDto.category,
      description: createTagDto.description,
      usageCount: 0,
      status: createTagDto.status || TagStatus.ACTIVE,
    } as Tag);

    return tag;
  }

  async findOrCreate(findOrCreateDto: FindOrCreateTagsDto): Promise<Tag[]> {
    const tags: Tag[] = [];

    for (const name of findOrCreateDto.names) {
      const { normalized, slug } = this.normalizeTagName(name);

      let tag = await this.tagRepository.findByNormalizedName(normalized);

      if (!tag) {
        tag = await this.tagRepository.create({
          name,
          normalizedName: normalized,
          slug,
          usageCount: 0,
          status: TagStatus.ACTIVE,
        } as Tag);
      }

      tags.push(tag);
    }

    return tags;
  }

  async findAll(query: QueryTagDto): Promise<Tag[]> {
    return this.tagRepository.findManyWithPagination({
      filterOptions: query.filters,
      sortOptions: query.sort,
      paginationOptions: {
        page: query.page || 1,
        limit: query.limit || 10,
      },
    });
  }

  async findOne(id: string): Promise<Tag> {
    const tag = await this.tagRepository.findById(id);
    if (!tag) {
      throw new NotFoundException(`Tag with id ${id} not found`);
    }
    return tag;
  }

  async findBySlug(slug: string): Promise<Tag> {
    const tag = await this.tagRepository.findBySlug(slug);
    if (!tag) {
      throw new NotFoundException(`Tag with slug ${slug} not found`);
    }
    return tag;
  }

  async search(query: string): Promise<Tag[]> {
    // Implement search logic based on normalized name
    // This is a simple implementation, you might want to use full-text search
    const { normalized } = this.normalizeTagName(query);
    const allTags = await this.tagRepository.findManyWithPagination({
      paginationOptions: { page: 1, limit: 100 },
    });

    return allTags.filter((tag) => tag.normalizedName.includes(normalized));
  }

  async update(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
    const tag = await this.tagRepository.findById(id);
    if (!tag) {
      throw new NotFoundException(`Tag with id ${id} not found`);
    }

    const updateData: Partial<Tag> = {};

    if (updateTagDto.name) {
      const { normalized, slug } = this.normalizeTagName(updateTagDto.name);
      updateData.name = updateTagDto.name;
      updateData.normalizedName = normalized;
      updateData.slug = slug;
    }

    if (updateTagDto.category !== undefined) {
      updateData.category = updateTagDto.category;
    }

    if (updateTagDto.description !== undefined) {
      updateData.description = updateTagDto.description;
    }

    if (updateTagDto.status) {
      updateData.status = updateTagDto.status;
    }

    const updatedTag = await this.tagRepository.update(id, updateData);
    if (!updatedTag) {
      throw new NotFoundException(`Tag with id ${id} not found`);
    }

    return updatedTag;
  }

  async remove(id: string): Promise<void> {
    const tag = await this.tagRepository.findById(id);
    if (!tag) {
      throw new NotFoundException(`Tag with id ${id} not found`);
    }

    await this.tagRepository.remove(id);
  }

  async incrementUsage(id: string): Promise<void> {
    await this.tagRepository.incrementUsageCount(id);
  }

  async decrementUsage(id: string): Promise<void> {
    await this.tagRepository.decrementUsageCount(id);
  }

  private normalizeTagName(name: string): {
    normalized: string;
    slug: string;
  } {
    const normalized = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^-+|-+$/g, '')
      .trim();

    const slug = normalized.replace(/\s+/g, '-');

    return { normalized, slug };
  }
}
