import { PrimaryColumn } from 'typeorm';
import { ContinuousAggregate, BucketColumn, CandlestickColumn } from '@vigillabs/timescale-db-typeorm';
import { StockPrice } from '../StockPrice';
import { Candlestick } from '@vigillabs/timescale-db-schemas';

@ContinuousAggregate(StockPrice, {
  name: 'stock_candlesticks_1m',
  bucket_interval: '1 minute',
  refresh_policy: {
    start_offset: '1 day',
    end_offset: '1 minute',
    schedule_interval: '1 minute',
  },
})
export class StockPrice1M {
  @BucketColumn({
    source_column: 'timestamp',
  })
  bucket!: Date;

  @PrimaryColumn()
  symbol!: string;

  @CandlestickColumn({
    time_column: 'timestamp',
    price_column: 'price',
    volume_column: 'volume',
  })
  candlestick!: Candlestick;
}
