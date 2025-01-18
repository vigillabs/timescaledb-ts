import { MigrationInterface, QueryRunner } from 'typeorm';

import { TimescaleDB } from '@timescaledb/core';

const hypertable = TimescaleDB.createHypertable('page_loads', {
  by_range: {
    column_name: 'time',
  },
  compression: {
    compress: true,
    compress_orderby: 'time',
    compress_segmentby: 'user_agent',
    policy: {
      schedule_interval: '7 days',
    },
  },
});

export class AddHypertable1737173805841 implements MigrationInterface {
  name = 'AddHypertable1737173805841';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sql = hypertable.up().build();

    await queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const sql = hypertable.down().build();

    await queryRunner.query(sql);
  }
}
