import { describe, it } from '@jest/globals';
import { TimescaleDB, ExtensionErrors } from '../src';

describe('Extension', () => {
  it('should fail when creating an extension without invalid options', () => {
    expect(() => {
      TimescaleDB.createExtension({
        // @ts-ignore
        invalidOption: 'invalid',
      });
    }).toThrow(ExtensionErrors.INVALID_OPTIONS);
  });

  describe('up', () => {
    it('should create an extension', () => {
      const extension = TimescaleDB.createExtension();

      const sql = extension.up().build();
      expect(sql).toMatchSnapshot();
    });

    it('should create an extension with cascade', () => {
      const extension = TimescaleDB.createExtension({
        should_cascade: true,
      });

      const sql = extension.up().build();
      expect(sql).toMatchSnapshot();
    });
  });

  describe('down', () => {
    it('should drop an extension', () => {
      const extension = TimescaleDB.createExtension();

      const sql = extension.down().build();
      expect(sql).toMatchSnapshot();
    });

    it('should drop an extension with cascade', () => {
      const extension = TimescaleDB.createExtension({
        should_cascade: true,
      });

      const sql = extension.down().build();
      expect(sql).toMatchSnapshot();
    });
  });
});
