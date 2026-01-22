import { z } from 'zod';

/**
 * Schema for creating a game
 */
export const createGameSchema = z.object({
  location: z
    .string()
    .max(100, 'Location cannot exceed 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  startTime: z.string().datetime('Invalid start time format'),
  minimumCashoutTime: z.string().datetime('Invalid minimum cashout time format'),
});

/**
 * Schema for completing a game
 */
export const completeGameSchema = z.object({
  discrepancyNotes: z
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
    .or(z.literal('')),
});

/**
 * Schema for adding a participant
 */
export const addParticipantSchema = z.object({
  playerId: z.string().min(1, 'Player ID is required'),
});

/**
 * Inferred types from schemas
 */
export type CreateGameInput = z.infer<typeof createGameSchema>;
export type CompleteGameInput = z.infer<typeof completeGameSchema>;
export type AddParticipantInput = z.infer<typeof addParticipantSchema>;
