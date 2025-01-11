export interface TimeRange {
  start: Date;
  end: Date;
}

export interface PageViewStats {
  interval: string;
  count: number;
  unique_users: number;
}

export interface CompressionStats {
  total_chunks: number;
  compressed_chunks: number;
}
