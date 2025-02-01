import { z } from 'zod';
import { TimeRangeSchema } from './time-range';

export const CandlestickAggregateOptionsSchema = z.object({
  price_column: z.string(),
  time_column: z.string(),
  volume_column: z.string().optional(),
  bucket_interval: z.string().optional().default('1 hour'),
});

export type CandlestickAggregateOptions = z.infer<typeof CandlestickAggregateOptionsSchema>;

export const CandlestickResultSchema = z.object({
  bucket_time: z.date(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number().optional(),
  vwap: z.number().optional(),
  open_time: z.date(),
  high_time: z.date(),
  low_time: z.date(),
  close_time: z.date(),
});

export type CandlestickResult = z.infer<typeof CandlestickResultSchema>;

export type GetCandlestickOptions = z.infer<typeof GetCandlestickOptionsSchema>;

export const GetCandlestickOptionsSchema = z.object({
  timeRange: TimeRangeSchema,
  config: CandlestickAggregateOptionsSchema,
});
