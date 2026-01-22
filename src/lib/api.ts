import type { ApiResult, FetchOptions } from '@/types/api';

const API_BASE = '/api';

/**
 * Generic API fetch wrapper with error handling
 */
export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResult<T>> {
  try {
    const { method = 'GET', body, headers = {} } = options;

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body !== undefined) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error ${response.status}`,
      };
    }

    return { success: true, data: data as T };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// =====================
// Player API
// =====================

import type {
  PlayerWithStats,
  PlayerDetail,
  Player,
  LeaderboardEntry,
} from '@/types/player';
import type { CreatePlayerRequest, UpdatePlayerRequest, ApiMessage } from '@/types/api';

export const playerApi = {
  getAll: () => apiFetch<PlayerWithStats[]>('/players'),

  getById: (id: string) => apiFetch<PlayerDetail>(`/players/${id}`),

  create: (data: CreatePlayerRequest) =>
    apiFetch<Player>('/players', { method: 'POST', body: data }),

  update: (id: string, data: UpdatePlayerRequest) =>
    apiFetch<Player>(`/players/${id}`, { method: 'PATCH', body: data }),

  delete: (id: string) =>
    apiFetch<ApiMessage>(`/players/${id}`, { method: 'DELETE' }),
};

// =====================
// Game API
// =====================

import type {
  GameWithStats,
  GameDetail,
  GameCreated,
  ParticipantAdded,
  GameCompleted,
} from '@/types/game';
import type {
  CreateGameRequest,
  AddParticipantRequest,
  CompleteGameRequest,
} from '@/types/api';

export const gameApi = {
  getAll: (status?: 'IN_PROGRESS' | 'COMPLETED') => {
    const query = status ? `?status=${status}` : '';
    return apiFetch<GameWithStats[]>(`/games${query}`);
  },

  getById: (id: string) => apiFetch<GameDetail>(`/games/${id}`),

  create: (data: CreateGameRequest) =>
    apiFetch<GameCreated>('/games', { method: 'POST', body: data }),

  addParticipant: (gameId: string, data: AddParticipantRequest) =>
    apiFetch<ParticipantAdded>(`/games/${gameId}/participants`, {
      method: 'POST',
      body: data,
    }),

  complete: (id: string, data: CompleteGameRequest) =>
    apiFetch<GameCompleted>(`/games/${id}/complete`, {
      method: 'PATCH',
      body: data,
    }),
};

// =====================
// Buy-In API
// =====================

import type { BuyIn, BuyInUpdated } from '@/types/transaction';
import type {
  CreateBuyInRequest,
  UpdateBuyInRequest,
} from '@/types/api';

export const buyInApi = {
  create: (data: CreateBuyInRequest) =>
    apiFetch<BuyIn>('/buy-ins', { method: 'POST', body: data }),

  update: (id: string, data: UpdateBuyInRequest) =>
    apiFetch<BuyInUpdated>(`/buy-ins/${id}`, { method: 'PATCH', body: data }),

  delete: (id: string) =>
    apiFetch<ApiMessage>(`/buy-ins/${id}`, { method: 'DELETE' }),
};

// =====================
// Cashout API
// =====================

import type { Cashout } from '@/types/transaction';
import type { CreateCashoutsRequest } from '@/types/api';

export const cashoutApi = {
  createBatch: (data: CreateCashoutsRequest) =>
    apiFetch<Cashout[]>('/cashouts', { method: 'POST', body: data }),
};

// =====================
// Leaderboard API
// =====================

export const leaderboardApi = {
  get: () => apiFetch<LeaderboardEntry[]>('/leaderboard'),
};
