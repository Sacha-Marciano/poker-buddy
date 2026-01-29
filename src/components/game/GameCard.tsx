import Link from 'next/link';
import { format } from 'date-fns';
import type { GameWithStats } from '@/types/game';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

export interface GameCardProps {
  game: GameWithStats;
}

export function GameCard({ game }: GameCardProps) {
  const isActive = game.status === 'IN_PROGRESS';

  return (
    <Link
      href={`/games/${game._id}`}
      className="block hover:opacity-80 transition-opacity"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-[#e8e0d4] truncate">
              {game.location || 'Game Session'}
            </h3>
            <Badge variant={isActive ? 'success' : 'default'} size="sm">
              {isActive ? 'Active' : 'Completed'}
            </Badge>
          </div>
          <p className="text-sm text-[#9a9088]">
            {format(new Date(game.startTime), 'MMM d, yyyy • h:mm a')}
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="text-[#9a9088]">
              {game.participantCount} player{game.participantCount !== 1 ? 's' : ''}
            </span>
            <span className="text-[#9a9088]">
              {formatCurrency(game.totalBuyIns)} in play
            </span>
          </div>
        </div>
        <svg
          className="w-5 h-5 text-[#9a9088] shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  );
}
