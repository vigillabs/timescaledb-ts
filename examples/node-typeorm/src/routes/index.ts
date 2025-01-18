import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { getPageViewStats, getCompressionStats } from '../services/timescale';
import { PageLoad } from '../models/PageLoad';

const router = Router();

router.post('/pageview', async (req, res) => {
  try {
    const userAgent = req.get('user-agent') || 'unknown';
    const time = new Date(); // Don't modify the timestamp

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

    const stats = await getPageViewStats({ start, end });
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

export default router;
