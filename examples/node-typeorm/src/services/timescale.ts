import { AppDataSource } from '../data-source';
import { TimeRange, CompressionStats } from '@timescaledb/schemas';
import { PageViewStats } from '../types';

export async function getPageViewStats(range: TimeRange): Promise<PageViewStats[]> {
  const stats = await AppDataSource.query(
    `
    WITH time_buckets AS (
      SELECT 
        time_bucket('1 hour', time) AS interval,
        COUNT(*) as count,
        COUNT(DISTINCT user_agent) as unique_users
      FROM page_loads
      WHERE time >= $1 AND time <= $2
      GROUP BY interval
      ORDER BY interval DESC
    )
    SELECT 
      TO_CHAR(interval, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as interval,
      count::integer as count,
      unique_users::integer as unique_users
    FROM time_buckets;
    `,
    [range.start, range.end],
  );

  return stats.map((stat: PageViewStats) => ({
    interval: stat.interval,
    count: Number(stat.count),
    unique_users: Number(stat.unique_users),
  }));
}

export async function getCompressionStats(): Promise<CompressionStats> {
  try {
    const [stats] = await AppDataSource.query(`
      SELECT 
        COALESCE(total_chunks, 0)::integer as total_chunks,
        COALESCE(number_compressed_chunks, 0)::integer as compressed_chunks
      FROM hypertable_compression_stats('page_loads');
    `);

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
