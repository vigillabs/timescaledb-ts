import { MigrationInterface, QueryRunner } from 'typeorm';
import { TimescaleDB } from '@timescaledb/core';

const extension = TimescaleDB.createExtension();

export class AddTimescaleExtension1737173805839 implements MigrationInterface {
  name = 'AddTimescaleExtension1737173805839';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sql = extension.up().build();

    await queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const sql = extension.down().build();

    await queryRunner.query(sql);
  }
}
