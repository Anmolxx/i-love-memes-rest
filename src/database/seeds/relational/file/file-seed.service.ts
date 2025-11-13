import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FileEntity } from '../../../../files/infrastructure/persistence/relational/entities/file.entity';
import { Repository } from 'typeorm';
import { FileStatus } from '../../../../files/file.enum';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileSeedService {
  constructor(
    @InjectRepository(FileEntity)
    private repository: Repository<FileEntity>,
  ) {}

  async run() {
    const count = await this.repository.count();

    if (count === 0) {
      // Get the files directory path (project root/files)
      const filesDir = path.join(process.cwd(), 'files');

      // Check if files directory exists
      if (!fs.existsSync(filesDir)) {
        console.log('Files directory does not exist, skipping file seeding');
        return;
      }

      // Read all files from the directory
      const files = fs.readdirSync(filesDir);

      // Filter only actual files (not directories)
      const actualFiles = files.filter((file) => {
        const filePath = path.join(filesDir, file);
        return fs.statSync(filePath).isFile();
      });

      if (actualFiles.length === 0) {
        console.log('No files found in files directory');
        return;
      }

      // Create database entries for each file
      const fileEntities = actualFiles.map((fileName) => {
        return this.repository.create({
          path: `/api/v1/files/${fileName}`,
          status: FileStatus.PERMANENT,
        });
      });

      await this.repository.save(fileEntities);
      console.log(`Seeded ${fileEntities.length} files from files directory`);
    }
  }
}
