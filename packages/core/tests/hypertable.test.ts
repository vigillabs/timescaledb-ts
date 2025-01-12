import { describe, it } from '@jest/globals';
import { TimescaleDB, HypertableErrors } from '../src';
import { CreateHypertableOptions } from '@timescaledb/schemas';

describe('Hypertable', () => {
  it('should fail when creating a hypertable without a name', () => {
    expect(() => {
      // @ts-ignore
      TimescaleDB.createHypertable('');
    }).toThrow(HypertableErrors.NAME_REQUIRED);
  });

  it('should fail when creating a hypertable without options', () => {
    expect(() => {
      // @ts-ignore
      TimescaleDB.createHypertable('my_table');
    }).toThrow(HypertableErrors.OPTIONS_REQUIRED);
  });

  it('should fail when creating a hypertable with invalid options', () => {
    expect(() => {
      // @ts-ignore
      TimescaleDB.createHypertable('my_table', {});
    }).toThrow(HypertableErrors.INVALID_OPTIONS);
  });

  describe('up', () => {
    it('should create and build a hypertable', () => {
      const options: CreateHypertableOptions = {
        by_range: {
          column_name: 'time',
        },
      };

      const sql = TimescaleDB.createHypertable('my_table', options).up().build();

      expect(sql).toMatchSnapshot();
    });

    it('should create and build a hypertable with compression', () => {
      const options: CreateHypertableOptions = {
        by_range: {
          column_name: 'time',
        },
        compression: {
          compress: true,
          compress_orderby: 'time',
          compress_segmentby: 'user_agent',
        },
      };

      const sql = TimescaleDB.createHypertable('my_table', options).up().build();

      expect(sql).toMatchSnapshot();
    });

    it('should create and build a hypertable with compression policy', () => {
      const options: CreateHypertableOptions = {
        by_range: {
          column_name: 'time',
        },
        compression: {
          compress: true,
          compress_orderby: 'time',
          compress_segmentby: 'user_agent',
          policy: {
            schedule_interval: '1d',
          },
        },
      };

      const sql = TimescaleDB.createHypertable('my_table', options).up().build();

      expect(sql).toMatchSnapshot();
    });
  });

  describe('down', () => {
    it('should drop a hypertable', () => {
      const options: CreateHypertableOptions = {
        by_range: {
          column_name: 'time',
        },
      };

      const sql = TimescaleDB.createHypertable('my_table', options).down().build();

      expect(sql).toMatchSnapshot();
    });

    it('should drop a hypertable with compression', () => {
      const options: CreateHypertableOptions = {
        by_range: {
          column_name: 'time',
        },
        compression: {
          compress: true,
          compress_orderby: 'time',
          compress_segmentby: 'user_agent',
        },
      };

      const sql = TimescaleDB.createHypertable('my_table', options).down().build();

      expect(sql).toMatchSnapshot();
    });

    it('should drop a hypertable with compression policy', () => {
      const options: CreateHypertableOptions = {
        by_range: {
          column_name: 'time',
        },
        compression: {
          compress: true,
          compress_orderby: 'time',
          compress_segmentby: 'user_agent',
          policy: {
            schedule_interval: '1d',
          },
        },
      };

      const sql = TimescaleDB.createHypertable('my_table', options).down().build();

      expect(sql).toMatchSnapshot();
    });
  });
});
