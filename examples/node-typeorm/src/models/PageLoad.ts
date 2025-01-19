import { Entity, PrimaryColumn } from 'typeorm';
import { Hypertable } from '@timescaledb/typeorm';

@Entity('page_loads')
@Hypertable({
  by_range: {
    column_name: 'time',
  },
  compression: {
    compress: true,
    compress_orderby: 'time',
    compress_segmentby: 'user_agent',
    policy: {
      schedule_interval: '7 days',
    },
  },
})
export class PageLoad {
  @PrimaryColumn({ name: 'user_agent', type: 'varchar' })
  userAgent!: string;

  @PrimaryColumn({ type: 'timestamp' })
  time!: Date;
}
