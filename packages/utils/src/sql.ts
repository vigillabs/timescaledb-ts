// The content of this file was extracted from https://github.com/brianc/node-postgres/blob/master/packages/pg/lib/utils.js

const MAX_IDENTIFIER_LENGTH = 63;

export function checkForControlChars(str: string): void {
  // Check for control characters
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1F\x7F]/.test(str)) {
    throw new Error('Control characters not allowed in literals');
  }
}

export function validateIdentifier(str: string, isTableName = false): void {
  if (!str) {
    throw new Error('Identifier cannot be empty');
  }

  // PostgreSQL will truncate identifiers longer than 63 bytes
  if (Buffer.from(str).length > MAX_IDENTIFIER_LENGTH) {
    throw new Error(`Identifier is too long (max ${MAX_IDENTIFIER_LENGTH} bytes)`);
  }

  checkForControlChars(str);

  if (isTableName) {
    const tableNameRegex = /^[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)?$/;
    if (!tableNameRegex.test(str)) {
      throw new Error('Table names must start with a letter and can only contain letters, numbers, and underscores');
    }
  }
}

export function escapeIdentifier(str: string): string {
  validateIdentifier(str);

  // Normalize Unicode for consistent handling
  str = str.normalize('NFC');

  // Double up any double quotes and wrap in quotes
  return `"${str.replace(/"/g, '""')}"`;
}

export function escapeLiteral(str: string): string {
  if (!str) {
    throw new Error('Literal value cannot be empty');
  }

  checkForControlChars(str);

  // Normalize Unicode for consistent handling
  str = str.normalize('NFC');

  let hasBackslash = false;
  let escaped = "'";

  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === "'") {
      escaped += c + c; // Double up single quotes
    } else if (c === '\\') {
      escaped += c + c; // Double up backslashes
      hasBackslash = true;
    } else {
      escaped += c;
    }
  }

  escaped += "'";

  // Add E prefix for strings containing backslashes
  if (hasBackslash) {
    escaped = 'E' + escaped;
  }

  return escaped;
}
