import {
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import { AllConfigType } from '../../../../config/config.type';
import { FileType } from '../../../domain/file';
import { FileStatus } from '../../../file.enum';

import { FileRepository } from '../../persistence/file.repository';

@Injectable()
export class FilesLocalService {
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly fileRepository: FileRepository,
  ) {}

  async create(file: Express.Multer.File): Promise<{ file: FileType }> {
    if (!file) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { file: 'selectFile' },
      });
    }

    const normalizedFilePath = file.path.replace(/\\/g, '/');

    return {
      file: await this.fileRepository.create({
        path: `/${this.configService.get('app.apiPrefix', { infer: true })}/v1/${normalizedFilePath}`,
        status: FileStatus.TEMPORARY,
      }),
    };
  }

  async updateStatus(id: FileType['id'], status: FileStatus) {
    const file = await this.fileRepository.findById(id);
    if (!file) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          file: `File with id ${id} not found.`,
        },
      });
    }

    return await this.fileRepository.updateStatus(id, status);
  }

  async delete(id: string): Promise<void> {
    const file = await this.fileRepository.findById(id);

    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found.`);
    }

    const localFilePath = path.join(
      process.cwd(),
      'files',
      path.basename(file.path),
    );
    try {
      await fs.unlink(localFilePath);
    } catch {
      console.warn(`File not found on disk: ${localFilePath}`);
    }

    await this.fileRepository.deleteById(id);
  }
}
