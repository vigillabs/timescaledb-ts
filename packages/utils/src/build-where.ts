import { escapeIdentifier } from './sql';
import { WhereClause } from '@timescaledb/schemas';

export function buildWhereClause(where: WhereClause, startParamIndex: number = 1): { sql: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = startParamIndex;

  for (const [column, condition] of Object.entries(where)) {
    const escapedColumn = escapeIdentifier(column);

    if (typeof condition === 'object' && !Array.isArray(condition) && !(condition instanceof Date)) {
      for (const [operator, value] of Object.entries(condition)) {
        if (Array.isArray(value) && (operator === 'IN' || operator === 'NOT IN')) {
          const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
          conditions.push(`${escapedColumn} ${operator} (${placeholders})`);
          params.push(...value);
        } else {
          conditions.push(`${escapedColumn} ${operator} $${paramIndex++}`);
          params.push(value);
        }
      }
    } else {
      conditions.push(`${escapedColumn} = $${paramIndex++}`);
      params.push(condition);
    }
  }

  return {
    sql: conditions.join(' AND '),
    params,
  };
}
