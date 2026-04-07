import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FileType } from '../../../domain/file';
import { FileStatus } from '../../../file.enum';
import { FileRepository } from '../../persistence/file.repository';

@Injectable()
export class FilesS3Service {
  constructor(private readonly fileRepository: FileRepository) {}

  async create(file: Express.MulterS3.File, cleanKey?: string): Promise<{ file: FileType }> {
    if (!file) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { file: 'selectFile' },
      });
    }

    const key = cleanKey ?? (() => {
      const rawKey = decodeURIComponent(file.key ?? '');
      const match = rawKey.match(/([^\/\?]+\.[a-z]+)(?:\?|$)/i);
      return match ? match[1] : rawKey.split('/').pop()!.split('?')[0];
    })();

    const path = `https://${process.env.AWS_DEFAULT_S3_BUCKET}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${file.key}`;

    return {
      file: await this.fileRepository.create({
        path,
        status: FileStatus.TEMPORARY,
      }),
    };
  }
}