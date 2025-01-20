import { AppDataSource } from '../data-source';
import { TimeRange } from '@timescaledb/schemas';
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
