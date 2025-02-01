import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStockPrice1738403699299 implements MigrationInterface {
  name = 'CreateStockPrice1738403699299';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "stock_prices" ("symbol" character varying NOT NULL, "timestamp" TIMESTAMP NOT NULL, "price" numeric(10,2) NOT NULL, "volume" numeric(10,2) NOT NULL, CONSTRAINT "PK_a42eff6e746633cc0a65fa01bce" PRIMARY KEY ("symbol", "timestamp"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "stock_prices"`);
  }
}
