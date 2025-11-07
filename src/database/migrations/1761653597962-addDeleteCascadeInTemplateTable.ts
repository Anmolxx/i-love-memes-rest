import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeleteCascadeInTemplateTable1761653597962
  implements MigrationInterface
{
  name = 'AddDeleteCascadeInTemplateTable1761653597962';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "template" DROP CONSTRAINT "FK_5726013f236e9c660d6a77acd47"`,
    );
    await queryRunner.query(
      `ALTER TABLE "memes" DROP CONSTRAINT "FK_e1823886d7db5f2677c5af1c2e7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" ADD CONSTRAINT "FK_5726013f236e9c660d6a77acd47" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "memes" ADD CONSTRAINT "FK_e1823886d7db5f2677c5af1c2e7" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "memes" DROP CONSTRAINT "FK_e1823886d7db5f2677c5af1c2e7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" DROP CONSTRAINT "FK_5726013f236e9c660d6a77acd47"`,
    );
    await queryRunner.query(
      `ALTER TABLE "memes" ADD CONSTRAINT "FK_e1823886d7db5f2677c5af1c2e7" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" ADD CONSTRAINT "FK_5726013f236e9c660d6a77acd47" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
