import { Entity, PrimaryColumn } from 'typeorm';

@Entity('page_loads')
export class PageLoad {
  @PrimaryColumn({ name: 'user_agent' })
  userAgent!: string;

  @PrimaryColumn()
  time!: Date;
}
