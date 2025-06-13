import { Candlestick } from '@timescaledb/schemas';
import { debugTypeOrm } from '../debug';

const debug = debugTypeOrm('parseCandlestick');

export function parseCandlestick(candlestickStr: string): Candlestick {
  debug('Parsing candlestick string');

  if (!candlestickStr.startsWith('(version:1')) {
    const error = 'Invalid candlestick string';
    debug(error);
    throw new Error(error);
  }

  const valuePattern = /val:(\d+(?:\.\d+)?)/g;
  const timePattern = /ts:"([^"]+)"/g;
  const volumePattern = /vol:(\d+(?:\.\d+)?)/;
  const vwapPattern = /vwap:(\d+(?:\.\d+)?)/;

  const values = [...candlestickStr.matchAll(valuePattern)].map((match) => parseFloat(match[1]));

  const timestamps = [...candlestickStr.matchAll(timePattern)].map((match) => new Date(match[1]));

  const volumeMatch = candlestickStr.match(volumePattern);
  const vwapMatch = candlestickStr.match(vwapPattern);

  const result = {
    open: values[0],
    high: values[1],
    low: values[2],
    close: values[3],
    open_time: timestamps[0],
    high_time: timestamps[1],
    low_time: timestamps[2],
    close_time: timestamps[3],
    volume: volumeMatch ? parseFloat(volumeMatch[1]) : undefined,
    vwap: vwapMatch ? parseFloat(vwapMatch[1]) : undefined,
  };

  debug('Candlestick parsed');

  return result;
}
