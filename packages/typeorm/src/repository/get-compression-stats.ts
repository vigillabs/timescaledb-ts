import { Repository, ObjectLiteral } from 'typeorm';
import { TimescaleDB } from '@vigillabs/timescale-db/core';
import { CompressionStats } from '@vigillabs/timescale-db/schemas';
import { HYPERTABLE_METADATA_KEY } from '../decorators/Hypertable';
import { debugTypeOrm } from '../debug';

const debug = debugTypeOrm('getCompressionStats');

export async function getCompressionStats(this: Repository<ObjectLiteral>): Promise<CompressionStats> {
  try {
    const target = this.target as Function;
    debug(`Getting compression stats for ${target.name}`);

    const options = Reflect.getMetadata(HYPERTABLE_METADATA_KEY, target);
    if (!options) {
      const error = 'Entity is not a hypertable';
      debug(error);
      throw new Error(error);
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

    const result = {
      compressed_chunks: stats?.compressed_chunks ?? 0,
      total_chunks: stats?.total_chunks ?? 0,
    };

    debug('Compression stats retrieved');

    return result;
  } catch (error) {
    const e = error as Error;
    const errorStr = 'Error getting compression stats' + (e.message ? `: ${e.message}` : '');
    debug(errorStr);
    return {
      compressed_chunks: 0,
      total_chunks: 0,
    };
  }
}
