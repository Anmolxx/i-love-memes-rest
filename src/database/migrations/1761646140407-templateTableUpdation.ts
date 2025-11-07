import { MigrationInterface, QueryRunner } from 'typeorm';

export class TemplateTableUpdation1761646140407 implements MigrationInterface {
  name = 'TemplateTableUpdation1761646140407';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "template" ADD "slug" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" ADD CONSTRAINT "UQ_4e152834feb5eb37e485708a59c" UNIQUE ("slug")`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" ADD "config" jsonb NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" ADD "authorId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."file_status_enum" RENAME TO "file_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."file_status_enum" AS ENUM('temporary', 'permanent', 'deleted')`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ALTER COLUMN "status" TYPE "public"."file_status_enum" USING "status"::"text"::"public"."file_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ALTER COLUMN "status" SET DEFAULT 'temporary'`,
    );
    await queryRunner.query(`DROP TYPE "public"."file_status_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "template" ALTER COLUMN "description" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4e152834feb5eb37e485708a59" ON "template" ("slug") `,
    );
    await queryRunner.query(
      `ALTER TABLE "template" ADD CONSTRAINT "FK_5726013f236e9c660d6a77acd47" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "template" DROP CONSTRAINT "FK_5726013f236e9c660d6a77acd47"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4e152834feb5eb37e485708a59"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" ALTER COLUMN "description" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."file_status_enum_old" AS ENUM('temporary', 'permanent')`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ALTER COLUMN "status" TYPE "public"."file_status_enum_old" USING "status"::"text"::"public"."file_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ALTER COLUMN "status" SET DEFAULT 'temporary'`,
    );
    await queryRunner.query(`DROP TYPE "public"."file_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."file_status_enum_old" RENAME TO "file_status_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "authorId"`);
    await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "config"`);
    await queryRunner.query(
      `ALTER TABLE "template" DROP CONSTRAINT "UQ_4e152834feb5eb37e485708a59c"`,
    );
    await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "slug"`);
  }
}
