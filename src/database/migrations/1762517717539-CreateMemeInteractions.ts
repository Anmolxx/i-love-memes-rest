import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMemeInteractions1762517717539 implements MigrationInterface {
  name = 'CreateMemeInteractions1762517717539';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "meme_tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "meme_id" uuid, "tag_id" uuid, CONSTRAINT "PK_19ef0c4ff629e5b348fa9a63588" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "template_tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "template_id" uuid, "tag_id" uuid, CONSTRAINT "PK_23f3328ba59f875e1beca9d2b0b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tags_status_enum" AS ENUM('ACTIVE', 'PENDING', 'REJECTED', 'BLACKLISTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(50) NOT NULL, "normalizedName" character varying(50) NOT NULL, "slug" character varying NOT NULL, "category" character varying(50), "description" text, "usageCount" integer NOT NULL DEFAULT '0', "status" "public"."tags_status_enum" NOT NULL DEFAULT 'ACTIVE', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_8b28b70e3ec92e110f003c2e550" UNIQUE ("normalizedName"), CONSTRAINT "UQ_b3aa10c29ea4e61a830362bd25a" UNIQUE ("slug"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8b28b70e3ec92e110f003c2e55" ON "tags" ("normalizedName") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b3aa10c29ea4e61a830362bd25" ON "tags" ("slug") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."comments_status_enum" AS ENUM('ACTIVE', 'EDITED', 'DELETED', 'HIDDEN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "replyCount" integer NOT NULL DEFAULT '0', "depth" integer NOT NULL DEFAULT '0', "status" "public"."comments_status_enum" NOT NULL DEFAULT 'ACTIVE', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "editedAt" TIMESTAMP, "deletedAt" TIMESTAMP, "meme_id" uuid, "author_id" uuid, "parent_comment_id" uuid, CONSTRAINT "PK_8bf68bc960f2b69e818bdb90dcb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e6d38899c31997c45d128a8973" ON "comments" ("author_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9fab2bc303fd8f34f89488ac89" ON "comments" ("meme_id", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."meme_interactions_type_enum" AS ENUM('UPVOTE', 'DOWNVOTE', 'REPORT', 'FLAG')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."meme_interactions_reason_enum" AS ENUM('SPAM', 'INAPPROPRIATE', 'COPYRIGHT', 'NSFW', 'HARASSMENT', 'VIOLENCE', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "meme_interactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."meme_interactions_type_enum" NOT NULL, "reason" "public"."meme_interactions_reason_enum", "note" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "meme_id" uuid, "user_id" uuid, CONSTRAINT "UQ_ebc5638de25b178b36f66135826" UNIQUE ("meme_id", "user_id", "type"), CONSTRAINT "PK_9464e55d85ae676ab46256edf8f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f521e786059d3b2523eaaef4bc" ON "meme_interactions" ("user_id", "type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b4cea32942a3c8849cb23b1b27" ON "meme_interactions" ("meme_id", "type") `,
    );
    await queryRunner.query(
      `ALTER TABLE "meme_tags" ADD CONSTRAINT "FK_7ba4478c9c1f15b2ef5f816a62f" FOREIGN KEY ("meme_id") REFERENCES "memes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "meme_tags" ADD CONSTRAINT "FK_e2f6b127549e9ffed19704268b3" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_tags" ADD CONSTRAINT "FK_075233873d1fa9d810a770b059a" FOREIGN KEY ("template_id") REFERENCES "template"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_tags" ADD CONSTRAINT "FK_42df87d8910ad4dc23de7e2d4fe" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_8f3a6a35e7aa671c66636cca35f" FOREIGN KEY ("meme_id") REFERENCES "memes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_e6d38899c31997c45d128a8973b" FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_93ce08bdbea73c0c7ee673ec35a" FOREIGN KEY ("parent_comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "meme_interactions" ADD CONSTRAINT "FK_93ede0aa212cc2d6e48b24b730f" FOREIGN KEY ("meme_id") REFERENCES "memes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "meme_interactions" ADD CONSTRAINT "FK_c8442969fb378391710c96de98e" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "meme_interactions" DROP CONSTRAINT "FK_c8442969fb378391710c96de98e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meme_interactions" DROP CONSTRAINT "FK_93ede0aa212cc2d6e48b24b730f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_93ce08bdbea73c0c7ee673ec35a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_e6d38899c31997c45d128a8973b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_8f3a6a35e7aa671c66636cca35f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_tags" DROP CONSTRAINT "FK_42df87d8910ad4dc23de7e2d4fe"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_tags" DROP CONSTRAINT "FK_075233873d1fa9d810a770b059a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meme_tags" DROP CONSTRAINT "FK_e2f6b127549e9ffed19704268b3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meme_tags" DROP CONSTRAINT "FK_7ba4478c9c1f15b2ef5f816a62f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b4cea32942a3c8849cb23b1b27"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f521e786059d3b2523eaaef4bc"`,
    );
    await queryRunner.query(`DROP TABLE "meme_interactions"`);
    await queryRunner.query(
      `DROP TYPE "public"."meme_interactions_reason_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."meme_interactions_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9fab2bc303fd8f34f89488ac89"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e6d38899c31997c45d128a8973"`,
    );
    await queryRunner.query(`DROP TABLE "comments"`);
    await queryRunner.query(`DROP TYPE "public"."comments_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b3aa10c29ea4e61a830362bd25"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8b28b70e3ec92e110f003c2e55"`,
    );
    await queryRunner.query(`DROP TABLE "tags"`);
    await queryRunner.query(`DROP TYPE "public"."tags_status_enum"`);
    await queryRunner.query(`DROP TABLE "template_tags"`);
    await queryRunner.query(`DROP TABLE "meme_tags"`);
  }
}
