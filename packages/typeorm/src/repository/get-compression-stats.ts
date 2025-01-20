import { Repository, ObjectLiteral } from 'typeorm';
import { TimescaleDB } from '@timescaledb/core';
import { CompressionStats } from '@timescaledb/schemas';
import { HYPERTABLE_METADATA_KEY } from '../decorators/Hypertable';

export async function getCompressionStats(this: Repository<ObjectLiteral>): Promise<CompressionStats> {
  try {
    const target = this.target as Function;
    const options = Reflect.getMetadata(HYPERTABLE_METADATA_KEY, target);
    if (!options) {
      throw new Error(`Entity is not a hypertable`);
    }

    const hypertable = TimescaleDB.createHypertable(this.metadata.tableName, options);

    const sql = hypertable
      .compression()
      .stats({
        select: {
          total_chunks: true,
          compressed_chunks: true,
        },
      })
      .build();

    const [stats] = await this.query(sql);

    return {
      compressed_chunks: stats?.compressed_chunks ?? 0,
      total_chunks: stats?.total_chunks ?? 0,
    };
  } catch (error) {
    console.error('Error getting compression stats:', error);
    return {
      compressed_chunks: 0,
      total_chunks: 0,
    };
  }
}
