import { z } from 'zod';

/**
 * Amount validation (shared)
 */
const amountSchema = z
  .number()
  .int('Amount must be a whole number')
  .min(1, 'Amount must be at least 1')
  .max(1000000, 'Amount cannot exceed 1,000,000');

/**
 * Cashout amount validation (allows 0)
 */
const cashoutAmountSchema = z
  .number()
  .int('Amount must be a whole number')
  .min(0, 'Amount cannot be negative')
  .max(1000000, 'Amount cannot exceed 1,000,000');

/**
 * Schema for creating a buy-in
 */
export const createBuyInSchema = z.object({
  gameParticipantId: z.string().min(1, 'Game participant ID is required'),
  amount: amountSchema,
  timestamp: z.string().datetime().optional(),
});

/**
 * Schema for updating a buy-in
 */
export const updateBuyInSchema = z.object({
  amount: amountSchema,
});

/**
 * Single cashout item in batch
 */
const cashoutItemSchema = z.object({
  gameParticipantId: z.string().min(1, 'Game participant ID is required'),
  amount: cashoutAmountSchema,
});

/**
 * Schema for creating cashouts (batch)
 */
export const createCashoutsSchema = z.object({
  gameId: z.string().min(1, 'Game ID is required'),
  cashouts: z.array(cashoutItemSchema).min(1, 'At least one cashout is required'),
});

/**
 * Inferred types from schemas
 */
export type CreateBuyInInput = z.infer<typeof createBuyInSchema>;
export type UpdateBuyInInput = z.infer<typeof updateBuyInSchema>;
export type CreateCashoutsInput = z.infer<typeof createCashoutsSchema>;
export type CashoutItem = z.infer<typeof cashoutItemSchema>;
