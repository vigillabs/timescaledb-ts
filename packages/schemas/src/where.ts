import { z } from 'zod';

export const WhereOperatorSchema = z.enum(['=', '>', '<', '>=', '<=', 'IN', 'NOT IN']);
export type WhereOperator = z.infer<typeof WhereOperatorSchema>;

export const WhereValueSchema = z.union([
  z.string(),
  z.number(),
  z.date(),
  z.array(z.union([z.string(), z.number(), z.date()])),
]);
export type WhereValue = z.infer<typeof WhereValueSchema>;

export const WhereConditionSchema = z.union([WhereValueSchema, z.record(WhereOperatorSchema, WhereValueSchema)]);
export type WhereCondition = z.infer<typeof WhereConditionSchema>;

export const WhereClauseSchema = z.record(z.string(), WhereConditionSchema);
export type WhereClause = z.infer<typeof WhereClauseSchema>;
