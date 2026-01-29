import { z } from 'zod';

/**
 * Schema for creating a player
 */
export const createPlayerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name cannot exceed 50 characters')
    .trim(),
  phone: z
    .string()
    .max(20, 'Phone number cannot exceed 20 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  avatarColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (e.g., #FF6B6B)')
    .optional()
    .or(z.literal('')),
});

/**
 * Schema for updating a player
 */
export const updatePlayerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name cannot exceed 50 characters')
    .trim(),
  phone: z
    .string()
    .max(20, 'Phone number cannot exceed 20 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  avatarColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (e.g., #FF6B6B)')
    .optional()
    .or(z.literal('')),
});

/**
 * Inferred types from schemas
 */
export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
