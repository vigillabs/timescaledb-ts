import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePageLoads1737173805840 implements MigrationInterface {
  name = 'CreatePageLoads1737173805840';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "page_loads" ("user_agent" character varying NOT NULL, "time" TIMESTAMP NOT NULL, CONSTRAINT "PK_648dbdfc9ed8d6f2490f61ca49d" PRIMARY KEY ("user_agent", "time"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "page_loads"`);
  }
}
