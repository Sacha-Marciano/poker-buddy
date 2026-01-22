'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { PageHeader, Button, Input, Card } from '@/components/ui';
import { gameApi } from '@/lib/api';
import { createGameSchema } from '@/schemas/game';

export default function CreateGamePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state with defaults
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);

  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState(format(now, "yyyy-MM-dd'T'HH:mm"));
  const [minCashoutTime, setMinCashoutTime] = useState(format(midnight, 'HH:mm'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Build minimum cashout datetime
    const startDate = new Date(startTime);
    const [hours, minutes] = minCashoutTime.split(':').map(Number);
    const minCashoutDate = new Date(startDate);
    minCashoutDate.setHours(hours, minutes, 0, 0);

    // If min cashout time is earlier than start time, assume next day
    if (minCashoutDate < startDate) {
      minCashoutDate.setDate(minCashoutDate.getDate() + 1);
    }

    // Validate
    const validation = createGameSchema.safeParse({
      location: location || undefined,
      startTime: startDate.toISOString(),
      minimumCashoutTime: minCashoutDate.toISOString(),
    });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Invalid input');
      return;
    }

    // Submit
    setIsSubmitting(true);
    const result = await gameApi.create(validation.data);
    setIsSubmitting(false);

    if (result.success) {
      router.push(`/games/${result.data._id}`);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="New Game" showBack />

      <main className="p-4">
        <form onSubmit={handleSubmit}>
          <Card variant="outlined">
            <div className="space-y-4">
              <Input
                label="Location"
                placeholder="e.g., John's place"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={100}
                hint="Optional"
              />

              <Input
                label="Start Time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />

              <Input
                label="Minimum Cashout Time (24h format)"
                type="time"
                value={minCashoutTime}
                onChange={(e) => setMinCashoutTime(e.target.value)}
                hint="Cashouts blocked until this time"
              />

              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.back()}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  fullWidth
                >
                  Create Game
                </Button>
              </div>
            </div>
          </Card>
        </form>
      </main>
    </div>
  );
}
