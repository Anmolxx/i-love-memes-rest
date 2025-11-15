import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationMetaDto } from '../utils/dto/pagination-response.dto';
import { generateBaseSlug, generateUniqueSlug } from '../utils/slug.util';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Tag } from './domain/tag';
import { CreateTagDto } from './dto/create-tag.dto';
import { FindOrCreateTagsDto } from './dto/find-or-create-tags.dto';
import {
  TagFilterOptionsDto,
  TagSortOptionsDto,
} from './dto/tag-filter-options.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagRepository } from './infrastructure/persistence/tag.repository';
import { TagStatus } from './tags.enum';

@Injectable()
export class TagsService {
  constructor(private readonly tagRepository: TagRepository) {}

  async create(createTagDto: CreateTagDto): Promise<Tag> {
    const { normalized } = this.normalizeTagName(createTagDto.name);

    // Check if tag already exists
    const existingTag =
      await this.tagRepository.findByNormalizedName(normalized);
    if (existingTag) {
      return existingTag;
    }

    // Automated unique slug generation
    const baseSlug = generateBaseSlug(createTagDto.name);
    const slug = await generateUniqueSlug(baseSlug, async (slug) => {
      const found = await this.tagRepository.findBySlug(slug);
      return !!found;
    });

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
      const { normalized } = this.normalizeTagName(name);

      let tag = await this.tagRepository.findByNormalizedName(normalized);

      if (!tag) {
        const baseSlug = generateBaseSlug(name);
        const slug = await generateUniqueSlug(baseSlug, async (slug) => {
          const found = await this.tagRepository.findBySlug(slug);
          return !!found;
        });
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

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: TagFilterOptionsDto | null;
    sortOptions?: TagSortOptionsDto | null;
    paginationOptions: IPaginationOptions;
  }): Promise<{ items: Tag[]; meta: PaginationMetaDto }> {
    // Repository now returns { items, meta } directly
    return this.tagRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  async findOne(slugOrId: string): Promise<Tag> {
    // Try to find by slug first (more user-friendly)
    let tag = await this.tagRepository.findBySlug(slugOrId);

    // If not found by slug, try by ID
    if (!tag) {
      tag = await this.tagRepository.findById(slugOrId);
    }

    if (!tag) {
      throw new NotFoundException(`Tag with identifier ${slugOrId} not found`);
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

  async update(slugOrId: string, updateTagDto: UpdateTagDto): Promise<Tag> {
    // Try to find by slug first
    let tag = await this.tagRepository.findBySlug(slugOrId);

    // If not found by slug, try by ID
    if (!tag) {
      tag = await this.tagRepository.findById(slugOrId);
    }

    if (!tag) {
      throw new NotFoundException(`Tag with identifier ${slugOrId} not found`);
    }

    const updateData: Partial<Tag> = {};

    if (updateTagDto.name) {
      const { normalized } = this.normalizeTagName(updateTagDto.name);
      updateData.name = updateTagDto.name;
      updateData.normalizedName = normalized;
      // Automated unique slug generation for update
      const baseSlug = generateBaseSlug(updateTagDto.name);
      const slug = await generateUniqueSlug(baseSlug, async (slug) => {
        const found = await this.tagRepository.findBySlug(slug);
        // Allow current tag's slug
        return !!found && found.id !== tag.id;
      });
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

    const updatedTag = await this.tagRepository.update(tag.id, updateData);
    if (!updatedTag) {
      throw new NotFoundException(`Tag with id ${tag.id} not found`);
    }

    return updatedTag;
  }

  async remove(slugOrId: string): Promise<void> {
    // Try to find by slug first
    let tag = await this.tagRepository.findBySlug(slugOrId);

    // If not found by slug, try by ID
    if (!tag) {
      tag = await this.tagRepository.findById(slugOrId);
    }

    if (!tag) {
      throw new NotFoundException(`Tag with identifier ${slugOrId} not found`);
    }

    await this.tagRepository.remove(tag.id);
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
