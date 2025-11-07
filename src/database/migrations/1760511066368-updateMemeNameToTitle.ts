import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMemeNameToTitle1760511066368 implements MigrationInterface {
  name = 'UpdateMemeNameToTitle1760511066368';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b370618e9e7ea44789b6b41b9e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "memes" RENAME COLUMN "name" TO "title"`,
    );
    await queryRunner.query(
      `ALTER TABLE "memes" RENAME CONSTRAINT "UQ_b370618e9e7ea44789b6b41b9e5" TO "UQ_1e3588166c29708552b9cb753b6"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1e3588166c29708552b9cb753b" ON "memes" ("title") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1e3588166c29708552b9cb753b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "memes" RENAME CONSTRAINT "UQ_1e3588166c29708552b9cb753b6" TO "UQ_b370618e9e7ea44789b6b41b9e5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "memes" RENAME COLUMN "title" TO "name"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b370618e9e7ea44789b6b41b9e" ON "memes" ("name") `,
    );
  }
}
