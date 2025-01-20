import sequelize from '../database';
import { PageViewStats } from '../types';
import { CompressionStats, TimeRange } from '@timescaledb/schemas';
import { pageLoadsHypertable } from '../../config/hypertable';
import { QueryTypes } from 'sequelize';

export async function getPageViewStats(range: TimeRange): Promise<PageViewStats[]> {
  const { sql, params } = pageLoadsHypertable
    .timeBucket(range, {
      interval: '1 hour',
      metrics: [
        { type: 'count', alias: 'count' },
        { type: 'distinct_count', column: 'user_agent', alias: 'unique_users' },
      ],
    })
    .build();

  const results = await sequelize.query(sql, {
    bind: params,
    type: QueryTypes.SELECT,
  });

  return results as PageViewStats[];
}

export async function getCompressionStats(): Promise<CompressionStats> {
  try {
    const sql = pageLoadsHypertable
      .compression()
      .stats({
        select: {
          total_chunks: true,
          compressed_chunks: true,
        },
      })
      .build();

    const [stats] = (await sequelize.query(sql, {
      type: QueryTypes.SELECT,
    })) as [CompressionStats];

    return {
      compressed_chunks: Number(stats?.compressed_chunks || 0),
      total_chunks: Number(stats?.total_chunks || 0),
    };
  } catch (error) {
    console.error('Error getting compression stats:', error);
    return {
      compressed_chunks: 0,
      total_chunks: 0,
    };
  }
}
