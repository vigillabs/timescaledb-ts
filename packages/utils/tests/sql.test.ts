import { describe, it, expect } from '@jest/globals';
import { escapeIdentifier, escapeLiteral } from '../src/sql';

describe('SQL Escaping', () => {
  describe('escapeIdentifier', () => {
    it('handles basic identifiers', () => {
      expect(escapeIdentifier('column_name')).toBe('"column_name"');
    });

    it('escapes double quotes', () => {
      expect(escapeIdentifier('my"column')).toBe('"my""column"');
    });

    it('allows spaces and special characters', () => {
      expect(escapeIdentifier('my column name!')).toBe('"my column name!"');
    });

    it('handles international characters', () => {
      expect(escapeIdentifier('über_måned')).toBe('"über_måned"');
    });

    it('normalizes Unicode', () => {
      // å can be represented two ways:
      // 1. å (\u00E5) - single character
      // 2. a\u030A - letter 'a' with combining ring above
      const withCombiningChar = 'a\u030A';
      const normalized = 'å';
      expect(escapeIdentifier(withCombiningChar)).toBe(`"${normalized}"`);
    });

    it('rejects empty identifiers', () => {
      expect(() => escapeIdentifier('')).toThrow('Identifier cannot be empty');
    });

    it('rejects too long identifiers', () => {
      expect(() => escapeIdentifier('a'.repeat(64))).toThrow('Identifier is too long');
    });
  });

  describe('escapeLiteral', () => {
    it('handles basic strings', () => {
      expect(escapeLiteral('simple')).toBe("'simple'");
    });

    it('escapes single quotes', () => {
      expect(escapeLiteral("O'Reilly")).toBe("'O''Reilly'");
    });

    it('escapes backslashes', () => {
      expect(escapeLiteral('path\\to\\file')).toBe("E'path\\\\to\\\\file'");
    });

    it('handles international characters', () => {
      expect(escapeLiteral('über')).toBe("'über'");
    });

    it('normalizes Unicode', () => {
      // å can be represented two ways:
      // 1. å (\u00E5) - single character
      // 2. a\u030A - letter 'a' with combining ring above
      const withCombiningChar = 'a\u030A';
      const normalized = 'å';
      expect(escapeLiteral(withCombiningChar)).toBe(`'${normalized}'`);
    });

    it('rejects control characters', () => {
      expect(() => escapeLiteral('bad\x00value')).toThrow('Control characters not allowed');
      expect(() => escapeLiteral('bad\x1Fvalue')).toThrow('Control characters not allowed');
      expect(() => escapeLiteral('bad\x7Fvalue')).toThrow('Control characters not allowed');
    });

    it('rejects empty literals', () => {
      expect(() => escapeLiteral('')).toThrow('Literal value cannot be empty');
    });
  });
});
