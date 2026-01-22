// Re-export all types
export * from './player';
export * from './game';
export * from './transaction';
export * from './api';

// Common utility types
export type WithId<T> = T & { _id: string };

export type BalanceStatus = 'GREEN' | 'YELLOW' | 'RED';

export type GameStatus = 'IN_PROGRESS' | 'COMPLETED';
