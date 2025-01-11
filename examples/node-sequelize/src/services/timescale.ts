import sequelize from '../database';
import { TimeRange, PageViewStats, CompressionStats } from '../types';
import { QueryTypes } from 'sequelize';

export async function getPageViewStats(range: TimeRange): Promise<PageViewStats[]> {
  const stats = await sequelize.query(
    `
    SELECT
      time_bucket('1 hour', time) AS interval,
      count(*) as count,
      count(distinct user_agent) as unique_users
      FROM page_loads
      WHERE time BETWEEN :start AND :end
      GROUP BY interval
      ORDER BY interval DESC
  `,
    {
      replacements: { start: range.start, end: range.end },
      type: QueryTypes.SELECT,
    },
  );

  return stats as PageViewStats[];
}

export async function getCompressionStats(): Promise<CompressionStats> {
  try {
    const [stats] = (await sequelize.query(`SELECT * FROM hypertable_compression_stats('page_loads');`, {
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
