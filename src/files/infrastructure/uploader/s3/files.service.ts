// import {
//   HttpStatus,
//   Injectable,
//   UnprocessableEntityException,
// } from '@nestjs/common';
// import { FileType } from '../../../domain/file';
// import { FileStatus } from '../../../file.enum';
// import { FileRepository } from '../../persistence/file.repository';

// @Injectable()
// export class FilesS3Service {
//   constructor(private readonly fileRepository: FileRepository) {}

//   async create(file: Express.MulterS3.File): Promise<{ file: FileType }> {
//     if (!file) {
//       throw new UnprocessableEntityException({
//         status: HttpStatus.UNPROCESSABLE_ENTITY,
//         errors: {
//           file: 'selectFile',
//         },
//       });
//     }

//     return {
//       file: await this.fileRepository.create({
//         path: `${process.env.AWS_S3_ENDPOINT}/object/public/${process.env.AWS_DEFAULT_S3_BUCKET}/${file.key}`,
//         status: FileStatus.TEMPORARY,
//       }),
//     };
//   }
// }

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

  async create(file: Express.MulterS3.File): Promise<{ file: FileType }> {
    if (!file) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          file: 'selectFile',
        },
      });
    }

    const supabasePublicUrl = `https://tnpwudwthsicppibhqzp.supabase.co/storage/v1/object/public/${process.env.AWS_DEFAULT_S3_BUCKET}/${file.key}`;

    return {
      file: await this.fileRepository.create({
        path: supabasePublicUrl,
        status: FileStatus.TEMPORARY,
      }),
    };
  }
}