import { describe, it, expect } from '@jest/globals';
import { TimescaleDB } from '../src';
import { CreateHypertableOptions } from '@timescaledb/schemas';

describe('Compression', () => {
  const defaultOptions: CreateHypertableOptions = {
    by_range: {
      column_name: 'time',
    },
  };

  describe('stats', () => {
    it('should generate stats query with all fields', () => {
      const hypertable = TimescaleDB.createHypertable('my_table', defaultOptions);
      const sql = hypertable
        .compression()
        .stats({
          select: {
            total_chunks: true,
            compressed_chunks: true,
          },
        })
        .build();

      expect(sql).toMatchSnapshot();
    });

    it('should generate stats query with only total_chunks', () => {
      const hypertable = TimescaleDB.createHypertable('my_table', defaultOptions);
      const sql = hypertable
        .compression()
        .stats({
          select: {
            total_chunks: true,
          },
        })
        .build();

      expect(sql).toMatchSnapshot();
    });

    it('should generate stats query with only compressed_chunks', () => {
      const hypertable = TimescaleDB.createHypertable('my_table', defaultOptions);
      const sql = hypertable
        .compression()
        .stats({
          select: {
            compressed_chunks: true,
          },
        })
        .build();

      expect(sql).toMatchSnapshot();
    });

    it('should generate stats query with no fields selected', () => {
      const hypertable = TimescaleDB.createHypertable('my_table', defaultOptions);
      const sql = hypertable
        .compression()
        .stats({
          select: {},
        })
        .build();

      expect(sql).toMatchSnapshot();
    });

    it('should fail when no stats options provided', () => {
      const hypertable = TimescaleDB.createHypertable('my_table', defaultOptions);
      expect(() => {
        // @ts-expect-error - Testing runtime error
        hypertable.compression().stats().build();
      }).toThrow();
    });

    it('should fail with invalid select options', () => {
      const hypertable = TimescaleDB.createHypertable('my_table', defaultOptions);
      expect(() => {
        hypertable
          .compression()
          .stats({
            select: {
              // @ts-ignore
              invalid_field: true,
            },
          })
          .build();
      }).toThrow();
    });
  });
});
