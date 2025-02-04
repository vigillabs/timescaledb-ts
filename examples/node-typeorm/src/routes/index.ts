import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { PageLoad } from '../models/PageLoad';
import { HourlyPageViews } from '../models/HourlyPageViews';
import { StockPrice } from '../models/StockPrice';
import { WhereClauseSchema } from '@timescaledb/schemas';

const router = Router();

router.post('/pageview', async (req, res) => {
  try {
    const userAgent = req.get('user-agent') || 'unknown';
    const time = new Date();

    const pageLoadRepository = AppDataSource.getRepository(PageLoad);
    await pageLoadRepository.save({ userAgent, time });

    res.json({ message: 'Page view recorded' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to record page view' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const start = new Date(req.query.start as string);
    const end = new Date(req.query.end as string);
    const where = req.query.where as string;
    const whereJson = where ? WhereClauseSchema.parse(JSON.parse(where)) : undefined;

    const repository = AppDataSource.getRepository(PageLoad);

    const stats = await repository.getTimeBucket({
      timeRange: {
        start,
        end,
      },
      where: whereJson,
      bucket: {
        interval: '1 hour',
        metrics: [
          { type: 'count', alias: 'count' },
          { type: 'distinct_count', column: 'user_agent', alias: 'unique_users' },
        ],
      },
    });

    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

router.get('/compression', async (req, res) => {
  try {
    const repository = AppDataSource.getRepository(PageLoad);
    const stats = await repository.getCompressionStats();
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get compression stats' });
  }
});

router.get('/hourly', async (req, res) => {
  try {
    const start = new Date(req.query.start as string);
    const end = new Date(req.query.end as string);

    const query = AppDataSource.getRepository(HourlyPageViews)
      .createQueryBuilder()
      .where('bucket >= :start', { start })
      .andWhere('bucket <= :end', { end })
      .orderBy('bucket', 'DESC');

    const hourlyViews = await query.getMany();

    res.json(hourlyViews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get hourly stats' });
  }
});

router.get('/candlestick', async (req, res) => {
  try {
    const start = new Date(req.query.start as string);
    const end = new Date(req.query.end as string);
    const where = req.query.where as string;
    const whereJson = where ? WhereClauseSchema.parse(JSON.parse(where)) : undefined;

    const repository = AppDataSource.getRepository(StockPrice);
    const candlesticks = await repository.getCandlesticks({
      timeRange: { start, end },
      config: {
        time_column: 'timestamp',
        price_column: 'price',
        volume_column: 'volume',
        bucket_interval: '1 hour',
      },
      where: whereJson,
    });

    res.json(candlesticks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get candlestick data' });
  }
});

export default router;
