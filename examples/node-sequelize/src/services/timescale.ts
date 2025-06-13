import sequelize from '../database';
import { PageViewStats } from '../types';
import { CompressionStats, TimeRange, WhereClause } from '@vigillabs/timescale-db-schemas';
import { PageLoads } from '../../config/PageLoads';
import { QueryTypes } from 'sequelize';
import { TimescaleDB } from '@vigillabs/timescale-db-core';

export async function getPageViewStats({
  range,
  where,
}: {
  range: TimeRange;
  where?: WhereClause;
}): Promise<PageViewStats[]> {
  const { sql, params } = PageLoads.timeBucket({
    interval: '1 hour',
    metrics: [
      { type: 'count', alias: 'count' },
      { type: 'distinct_count', column: 'user_agent', alias: 'unique_users' },
    ],
  }).build({
    range,
    where,
  });

  const results = await sequelize.query(sql, {
    bind: params,
    type: QueryTypes.SELECT,
  });

  return results as PageViewStats[];
}

export async function getCompressionStats(): Promise<CompressionStats> {
  try {
    const sql = PageLoads.compression()
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

export async function getCandlestickData({
  start,
  end,
  interval = '1 hour',
  where,
}: {
  start: Date;
  end: Date;
  interval?: string;
  where?: WhereClause;
}) {
  const candlestick = TimescaleDB.createCandlestickAggregate('stock_prices', {
    time_column: 'timestamp',
    price_column: 'price',
    volume_column: 'volume',
    bucket_interval: interval,
  });

  const { sql, params } = candlestick.build({
    range: { start, end },
    where,
  });

  const results = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    bind: params,
  });

  return results.map((row: any) => ({
    bucket_time: new Date(row.bucket_time),
    open: Number(row.open),
    high: Number(row.high),
    low: Number(row.low),
    close: Number(row.close),
    volume: Number(row.volume),
    vwap: Number(row.vwap),
    open_time: new Date(row.open_time),
    high_time: new Date(row.high_time),
    low_time: new Date(row.low_time),
    close_time: new Date(row.close_time),
  }));
}
