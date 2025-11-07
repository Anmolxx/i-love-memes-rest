import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMemesTableWithColumnAuthor1760517755293
  implements MigrationInterface
{
  name = 'UpdateMemesTableWithColumnAuthor1760517755293';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "memes" ADD "authorId" uuid NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "memes" ADD CONSTRAINT "FK_e1823886d7db5f2677c5af1c2e7" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "memes" DROP CONSTRAINT "FK_e1823886d7db5f2677c5af1c2e7"`,
    );
    await queryRunner.query(`ALTER TABLE "memes" DROP COLUMN "authorId"`);
  }
}
