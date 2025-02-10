import { Router } from 'express';
import PageLoad from '../models/PageLoad';
import { getPageViewStats, getCompressionStats, getCandlestickData } from '../services/timescale';
import HourlyPageView from '../models/HourlyPageView';
import DailyPageStats from '../models/DailyPageStats';
import { Op } from 'sequelize';
import { WhereClauseSchema } from '@timescaledb/schemas';

const router = Router();

router.post('/pageview', async (req, res) => {
  try {
    const userAgent = req.get('user-agent') || 'unknown';
    const time = new Date();

    await PageLoad.create({ userAgent, time });
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
    const whereClause = where ? WhereClauseSchema.parse(JSON.parse(where)) : undefined;

    const stats = await getPageViewStats({
      where: whereClause,
      range: {
        start,
        end,
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
    const stats = await getCompressionStats();
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

    const hourlyViews = await HourlyPageView.findAll({
      where: {
        bucket: {
          [Op.between]: [start, end],
        },
      },
      order: [['bucket', 'DESC']],
    });

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
    const interval = req.query.interval as string;

    const where = req.query.where as string;
    const whereClause = where ? WhereClauseSchema.parse(JSON.parse(where)) : undefined;

    const candlesticks = await getCandlestickData({ start, end, interval, where: whereClause });

    res.json(candlesticks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get candlestick data' });
  }
});

router.get('/daily', async (req, res) => {
  try {
    const start = new Date(req.query.start as string);
    const end = new Date(req.query.end as string);

    const dailyStats = await DailyPageStats.findAll({
      where: {
        bucket: {
          [Op.between]: [start, end],
        },
      },
      order: [['bucket', 'DESC']],
    });

    res.json(dailyStats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get daily stats' });
  }
});

export default router;
