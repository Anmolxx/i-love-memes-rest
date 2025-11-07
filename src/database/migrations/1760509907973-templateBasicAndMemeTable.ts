import { MigrationInterface, QueryRunner } from 'typeorm';

export class TemplateBasicAndMemeTable1760509907973
  implements MigrationInterface
{
  name = 'TemplateBasicAndMemeTable1760509907973';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "template" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_9879d3d9fc533c94456a5566dc2" UNIQUE ("title"), CONSTRAINT "PK_fbae2ac36bd9b5e1e793b957b7f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9879d3d9fc533c94456a5566dc" ON "template" ("title") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."memes_audience_enum" AS ENUM('public', 'private', 'link')`,
    );
    await queryRunner.query(
      `CREATE TABLE "memes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(30) NOT NULL, "slug" character varying NOT NULL, "description" text, "audience" "public"."memes_audience_enum" NOT NULL DEFAULT 'public', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "templateId" uuid, "fileId" uuid, CONSTRAINT "UQ_b370618e9e7ea44789b6b41b9e5" UNIQUE ("name"), CONSTRAINT "UQ_f9f8b40e153763ad36850a73179" UNIQUE ("slug"), CONSTRAINT "REL_349f91183b60a2c2ba58c95822" UNIQUE ("fileId"), CONSTRAINT "PK_12846fb6620e0a6a8ff699db4fa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b370618e9e7ea44789b6b41b9e" ON "memes" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f9f8b40e153763ad36850a7317" ON "memes" ("slug") `,
    );
    await queryRunner.query(
      `ALTER TABLE "session" DROP CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11"`,
    );
    await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "session" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "session" ADD CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "memes" ADD CONSTRAINT "FK_a3bfd78cdaaa332eb834323d4fc" FOREIGN KEY ("templateId") REFERENCES "template"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "memes" ADD CONSTRAINT "FK_349f91183b60a2c2ba58c958229" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "memes" DROP CONSTRAINT "FK_349f91183b60a2c2ba58c958229"`,
    );
    await queryRunner.query(
      `ALTER TABLE "memes" DROP CONSTRAINT "FK_a3bfd78cdaaa332eb834323d4fc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "session" DROP CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11"`,
    );
    await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "session" ADD "id" SERIAL NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "session" ADD CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f9f8b40e153763ad36850a7317"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b370618e9e7ea44789b6b41b9e"`,
    );
    await queryRunner.query(`DROP TABLE "memes"`);
    await queryRunner.query(`DROP TYPE "public"."memes_audience_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9879d3d9fc533c94456a5566dc"`,
    );
    await queryRunner.query(`DROP TABLE "template"`);
  }
}
