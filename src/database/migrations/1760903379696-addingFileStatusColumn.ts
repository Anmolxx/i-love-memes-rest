import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddingFileStatusColumn1760903379696 implements MigrationInterface {
  name = 'AddingFileStatusColumn1760903379696';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."file_status_enum" AS ENUM('temporary', 'permanent')`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD "status" "public"."file_status_enum" NOT NULL DEFAULT 'temporary'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."file_status_enum"`);
  }
}
