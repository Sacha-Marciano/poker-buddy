// Historical game data from Hold'em House app
// Games are sorted oldest first
//
// Data format: Each player has totalBuyIn (total chips bought), rebuys (number of rebuy transactions),
// and profitLoss (final result). The seed script expands these into individual buy-in/cashout records.
// Buy-in splitting: totalBuyIn is divided evenly across (1 + rebuys) transactions.
// Cashout amount = totalBuyIn + profitLoss.

export interface HistoricalGamePlayer {
  name: string;
  totalBuyIn: number;
  rebuys: number;
  profitLoss: number;
}

export interface HistoricalGame {
  startTime: Date;
  endTime: Date;
  players: HistoricalGamePlayer[];
}

export const historicalGames: HistoricalGame[] = [
  // Game 1: Nov 1, 2025 — Total buy-ins: ₪2000
  {
    startTime: new Date('2025-11-01T14:28:30.956Z'),
    endTime: new Date('2025-11-01T14:32:25.877Z'),
    players: [
      { name: 'Tom Kilstein', totalBuyIn: 250, rebuys: 2, profitLoss: 600 },
      { name: 'Nathy Stanislas', totalBuyIn: 100, rebuys: 1, profitLoss: 200 },
      { name: 'Layani Noam', totalBuyIn: 100, rebuys: 0, profitLoss: 100 },
      { name: 'Matan Pozezynski', totalBuyIn: 100, rebuys: 1, profitLoss: -40 },
      { name: 'Dylan Teboul', totalBuyIn: 100, rebuys: 1, profitLoss: -100 },
      { name: 'Daniel Ziker', totalBuyIn: 200, rebuys: 2, profitLoss: -200 },
      { name: 'Bettan Noam', totalBuyIn: 250, rebuys: 3, profitLoss: -250 },
      { name: 'Ariel Dahan', totalBuyIn: 500, rebuys: 5, profitLoss: -300 },
      { name: 'Cicurel Noam', totalBuyIn: 400, rebuys: 3, profitLoss: -400 },
    ],
  },
  // Game 2: Nov 6, 2025 — Total buy-ins: ₪2010
  {
    startTime: new Date('2025-11-06T19:47:41.527Z'),
    endTime: new Date('2025-11-07T00:01:05.727Z'),
    players: [
      { name: 'Tom Kilstein', totalBuyIn: 160, rebuys: 1, profitLoss: 780 },
      { name: 'Bettan Noam', totalBuyIn: 100, rebuys: 0, profitLoss: 300 },
      { name: 'Layani Noam', totalBuyIn: 250, rebuys: 4, profitLoss: 100 },
      { name: 'Nathy Stanislas', totalBuyIn: 100, rebuys: 1, profitLoss: 0 },
      { name: 'Matan Pozezynski', totalBuyIn: 200, rebuys: 3, profitLoss: -100 },
      { name: 'Dylan Teboul', totalBuyIn: 100, rebuys: 1, profitLoss: -100 },
      { name: 'Cicurel Noam', totalBuyIn: 300, rebuys: 2, profitLoss: -180 },
      { name: 'Sacha Marciano', totalBuyIn: 200, rebuys: 3, profitLoss: -200 },
      { name: 'Daniel Ziker', totalBuyIn: 600, rebuys: 10, profitLoss: -600 },
    ],
  },
  // Game 3: Nov 11, 2025 — Total buy-ins: ₪1850
  {
    startTime: new Date('2025-11-10T23:09:26.229Z'),
    endTime: new Date('2025-11-11T00:19:44.952Z'),
    players: [
      { name: 'Ariel Dahan', totalBuyIn: 100, rebuys: 0, profitLoss: 350 },
      { name: 'Layani Noam', totalBuyIn: 200, rebuys: 2, profitLoss: 250 },
      { name: 'Dan Chiche', totalBuyIn: 150, rebuys: 1, profitLoss: 250 },
      { name: 'Nathy Stanislas', totalBuyIn: 300, rebuys: 3, profitLoss: 215 },
      { name: 'Nathan Amar', totalBuyIn: 200, rebuys: 2, profitLoss: -200 },
      { name: 'Hillel Bouskila', totalBuyIn: 400, rebuys: 2, profitLoss: -400 },
      { name: 'Tom Kilstein', totalBuyIn: 500, rebuys: 5, profitLoss: -465 },
    ],
  },
  // Game 4: Nov 13, 2025 — Total buy-ins: ₪1935
  {
    startTime: new Date('2025-11-13T21:41:37.651Z'),
    endTime: new Date('2025-11-13T23:46:55.745Z'),
    players: [
      { name: 'Benichou', totalBuyIn: 150, rebuys: 2, profitLoss: 450 },
      { name: 'Daniel Ziker', totalBuyIn: 150, rebuys: 1, profitLoss: 350 },
      { name: 'Tom Kilstein', totalBuyIn: 160, rebuys: 1, profitLoss: 240 },
      { name: 'Dylan Teboul', totalBuyIn: 50, rebuys: 0, profitLoss: 45 },
      { name: 'Nathy Stanislas', totalBuyIn: 375, rebuys: 5, profitLoss: -35 },
      { name: 'Sacha Marciano', totalBuyIn: 100, rebuys: 1, profitLoss: -100 },
      { name: 'David Sade', totalBuyIn: 100, rebuys: 1, profitLoss: -100 },
      { name: 'Layani Noam', totalBuyIn: 200, rebuys: 2, profitLoss: -200 },
      { name: 'Miko de tunis', totalBuyIn: 250, rebuys: 3, profitLoss: -250 },
      { name: 'Bettan Noam', totalBuyIn: 400, rebuys: 6, profitLoss: -400 },
    ],
  },
  // Game 5: Nov 17, 2025 — Total buy-ins: ₪1700
  {
    startTime: new Date('2025-11-16T23:23:11.642Z'),
    endTime: new Date('2025-11-16T23:34:03.579Z'),
    players: [
      { name: 'Barak Pozezynski', totalBuyIn: 50, rebuys: 0, profitLoss: 785 },
      { name: 'Dan Chiche', totalBuyIn: 100, rebuys: 0, profitLoss: 170 },
      { name: 'Daniel Ziker', totalBuyIn: 200, rebuys: 2, profitLoss: 110 },
      { name: 'Bettan Noam', totalBuyIn: 250, rebuys: 4, profitLoss: -25 },
      { name: 'Layani Noam', totalBuyIn: 50, rebuys: 0, profitLoss: -50 },
      { name: 'Matan Pozezynski', totalBuyIn: 50, rebuys: 0, profitLoss: -50 },
      { name: 'Miko de tunis', totalBuyIn: 150, rebuys: 2, profitLoss: -150 },
      { name: 'Tom Kilstein', totalBuyIn: 450, rebuys: 4, profitLoss: -390 },
      { name: 'Ariel Dahan', totalBuyIn: 400, rebuys: 5, profitLoss: -400 },
    ],
  },
  // Game 6: Nov 23, 2025 — Total buy-ins: ₪1400
  {
    startTime: new Date('2025-11-22T22:10:05.355Z'),
    endTime: new Date('2025-11-22T22:22:51.722Z'),
    players: [
      { name: 'Tom Kilstein', totalBuyIn: 300, rebuys: 4, profitLoss: 480 },
      { name: 'Nathy Stanislas', totalBuyIn: 150, rebuys: 2, profitLoss: 290 },
      { name: 'Ariel Dahan', totalBuyIn: 100, rebuys: 0, profitLoss: 0 },
      { name: 'Layani Noam', totalBuyIn: 200, rebuys: 1, profitLoss: -120 },
      { name: 'Dylan Teboul', totalBuyIn: 200, rebuys: 2, profitLoss: -200 },
      { name: 'Daniel Ziker', totalBuyIn: 200, rebuys: 1, profitLoss: -200 },
      { name: 'Sacha Marciano', totalBuyIn: 250, rebuys: 2, profitLoss: -250 },
    ],
  },
  // Game 7: Nov 24, 2025 — Total buy-ins: ₪2425
  {
    startTime: new Date('2025-11-24T16:58:00.000Z'),
    endTime: new Date('2025-11-30T17:04:34.953Z'),
    players: [
      { name: 'Layani Noam', totalBuyIn: 50, rebuys: 0, profitLoss: 440 },
      { name: 'Dylan Teboul', totalBuyIn: 125, rebuys: 1, profitLoss: 265 },
      { name: 'Dan Chiche', totalBuyIn: 400, rebuys: 3, profitLoss: 100 },
      { name: 'Barak Pozezynski', totalBuyIn: 200, rebuys: 3, profitLoss: 0 },
      { name: 'Nathy Stanislas', totalBuyIn: 350, rebuys: 3, profitLoss: -30 },
      { name: 'Tom Kilstein', totalBuyIn: 400, rebuys: 3, profitLoss: -55 },
      { name: 'Ben Azhari', totalBuyIn: 100, rebuys: 1, profitLoss: -100 },
      { name: 'Andrei Zinkin', totalBuyIn: 300, rebuys: 1, profitLoss: -120 },
      { name: 'Daniel Ziker', totalBuyIn: 500, rebuys: 4, profitLoss: -500 },
    ],
  },
  // Game 8: Nov 30, 2025 — Total buy-ins: ₪2465
  {
    startTime: new Date('2025-11-30T17:04:54.980Z'),
    endTime: new Date('2025-11-30T17:13:07.306Z'),
    players: [
      { name: 'Nathy Stanislas', totalBuyIn: 100, rebuys: 1, profitLoss: 790 },
      { name: 'Cicurel Noam', totalBuyIn: 300, rebuys: 2, profitLoss: 390 },
      { name: 'Bettan Noam', totalBuyIn: 200, rebuys: 2, profitLoss: 290 },
      { name: 'Barak Pozezynski', totalBuyIn: 50, rebuys: 0, profitLoss: -50 },
      { name: 'Tom Kilstein', totalBuyIn: 240, rebuys: 2, profitLoss: -115 },
      { name: 'Dan Chiche', totalBuyIn: 400, rebuys: 3, profitLoss: -130 },
      { name: 'Layani Noam', totalBuyIn: 150, rebuys: 2, profitLoss: -150 },
      { name: 'Benichou', totalBuyIn: 175, rebuys: 1, profitLoss: -175 },
      { name: 'Ariel Dahan', totalBuyIn: 400, rebuys: 4, profitLoss: -400 },
      { name: 'Daniel Ziker', totalBuyIn: 450, rebuys: 4, profitLoss: -450 },
    ],
  },
  // Game 9: Dec 5, 2025 — Total buy-ins: ₪2200
  {
    startTime: new Date('2025-12-05T00:24:16.461Z'),
    endTime: new Date('2025-12-05T00:29:55.241Z'),
    players: [
      { name: 'Dan Chiche', totalBuyIn: 150, rebuys: 1, profitLoss: 496 },
      { name: 'Daniel Ziker', totalBuyIn: 250, rebuys: 2, profitLoss: 350 },
      { name: 'Barak Pozezynski', totalBuyIn: 100, rebuys: 0, profitLoss: 60 },
      { name: 'Nathy Stanislas', totalBuyIn: 350, rebuys: 3, profitLoss: 52 },
      { name: 'Cicurel Noam', totalBuyIn: 350, rebuys: 3, profitLoss: 42 },
      { name: 'Dylan Teboul', totalBuyIn: 50, rebuys: 0, profitLoss: -50 },
      { name: 'Layani Noam', totalBuyIn: 150, rebuys: 2, profitLoss: -150 },
      { name: 'Tom Kilstein', totalBuyIn: 200, rebuys: 1, profitLoss: -200 },
      { name: 'Yakov Ziker', totalBuyIn: 200, rebuys: 3, profitLoss: -200 },
      { name: 'Bettan Noam', totalBuyIn: 400, rebuys: 3, profitLoss: -400 },
    ],
  },
  // Game 10: Dec 8, 2025 — Total buy-ins: ₪1780
  {
    startTime: new Date('2025-12-08T21:44:50.732Z'),
    endTime: new Date('2025-12-08T22:04:34.180Z'),
    players: [
      { name: 'Nathy Stanislas', totalBuyIn: 50, rebuys: 0, profitLoss: 690 },
      { name: 'Daniel Ziker', totalBuyIn: 200, rebuys: 2, profitLoss: 250 },
      { name: 'Dan Chiche', totalBuyIn: 400, rebuys: 3, profitLoss: -30 },
      { name: 'Yakov Ziker', totalBuyIn: 250, rebuys: 2, profitLoss: -150 },
      { name: 'Barak Pozezynski', totalBuyIn: 150, rebuys: 2, profitLoss: -150 },
      { name: 'Sacha Marciano', totalBuyIn: 200, rebuys: 1, profitLoss: -200 },
      { name: 'Dylan Teboul', totalBuyIn: 200, rebuys: 2, profitLoss: -200 },
      { name: 'Tom Kilstein', totalBuyIn: 330, rebuys: 3, profitLoss: -210 },
    ],
  },
  // Game 11: Dec 29, 2025 — Total buy-ins: ₪1575
  {
    startTime: new Date('2025-12-28T23:02:09.698Z'),
    endTime: new Date('2025-12-28T23:07:25.317Z'),
    players: [
      { name: 'Daniel Ziker', totalBuyIn: 100, rebuys: 1, profitLoss: 790 },
      { name: 'Tom Kilstein', totalBuyIn: 225, rebuys: 3, profitLoss: 240 },
      { name: 'Matan Pozezynski', totalBuyIn: 100, rebuys: 1, profitLoss: 100 },
      { name: 'Dan Chiche', totalBuyIn: 50, rebuys: 0, profitLoss: -50 },
      { name: 'Nathan Amar', totalBuyIn: 100, rebuys: 1, profitLoss: -100 },
      { name: 'Layani Noam', totalBuyIn: 100, rebuys: 1, profitLoss: -100 },
      { name: 'Barak Pozezynski', totalBuyIn: 200, rebuys: 3, profitLoss: -200 },
      { name: 'Benichou', totalBuyIn: 200, rebuys: 3, profitLoss: -200 },
      { name: 'Ariel Dahan', totalBuyIn: 500, rebuys: 4, profitLoss: -480 },
    ],
  },
  // Game 12: Jan 4, 2026 — Total buy-ins: ₪1725
  {
    startTime: new Date('2026-01-03T23:29:07.032Z'),
    endTime: new Date('2026-01-03T23:35:27.575Z'),
    players: [
      { name: 'Benichou', totalBuyIn: 200, rebuys: 3, profitLoss: 400 },
      { name: 'Matan Pozezynski', totalBuyIn: 50, rebuys: 0, profitLoss: 234 },
      { name: 'Ariel Dahan', totalBuyIn: 150, rebuys: 1, profitLoss: 15 },
      { name: 'Tom Kilstein', totalBuyIn: 250, rebuys: 2, profitLoss: 1 },
      { name: 'Daniel Tsadka', totalBuyIn: 300, rebuys: 2, profitLoss: 0 },
      { name: 'Barak Pozezynski', totalBuyIn: 100, rebuys: 0, profitLoss: -100 },
      { name: 'Yakov Ziker', totalBuyIn: 250, rebuys: 2, profitLoss: -125 },
      { name: 'Daniel Ziker', totalBuyIn: 175, rebuys: 0, profitLoss: -175 },
      { name: 'Bettan Noam', totalBuyIn: 250, rebuys: 2, profitLoss: -250 },
    ],
  },
  // Game 13: Jan 11, 2026 — Total buy-ins: ₪1925
  {
    startTime: new Date('2026-01-10T22:36:39.910Z'),
    endTime: new Date('2026-01-10T22:42:39.507Z'),
    players: [
      { name: 'Daniel Ziker', totalBuyIn: 350, rebuys: 3, profitLoss: 800 },
      { name: 'Yakov Ziker', totalBuyIn: 150, rebuys: 1, profitLoss: 200 },
      { name: 'Bettan Noam', totalBuyIn: 250, rebuys: 2, profitLoss: 45 },
      { name: 'Matan Pozezynski', totalBuyIn: 100, rebuys: 1, profitLoss: -100 },
      { name: 'Nathan Amar', totalBuyIn: 100, rebuys: 1, profitLoss: -100 },
      { name: 'Tom Kilstein', totalBuyIn: 275, rebuys: 0, profitLoss: -145 },
      { name: 'Barak Pozezynski', totalBuyIn: 150, rebuys: 2, profitLoss: -150 },
      { name: 'Nathy Stanislas', totalBuyIn: 150, rebuys: 2, profitLoss: -150 },
      { name: 'Benichou', totalBuyIn: 400, rebuys: 3, profitLoss: -400 },
    ],
  },
  // Game 14: Jan 18, 2026 — Total buy-ins: ₪2300
  {
    startTime: new Date('2026-01-17T23:49:18.456Z'),
    endTime: new Date('2026-01-17T23:52:56.349Z'),
    players: [
      { name: 'Sam Tsiman', totalBuyIn: 150, rebuys: 1, profitLoss: 500 },
      { name: 'Benichou', totalBuyIn: 150, rebuys: 2, profitLoss: 370 },
      { name: 'Jordan Bar', totalBuyIn: 150, rebuys: 0, profitLoss: 270 },
      { name: 'Ariel Dahan', totalBuyIn: 225, rebuys: 0, profitLoss: 95 },
      { name: 'Tom Kilstein', totalBuyIn: 375, rebuys: 0, profitLoss: 15 },
      { name: 'Layani Noam', totalBuyIn: 200, rebuys: 1, profitLoss: -200 },
      { name: 'Yakov Ziker', totalBuyIn: 250, rebuys: 2, profitLoss: -250 },
      { name: 'Nathy Stanislas', totalBuyIn: 300, rebuys: 2, profitLoss: -300 },
      { name: 'Daniel Ziker', totalBuyIn: 500, rebuys: 0, profitLoss: -500 },
    ],
  },
  // Game 15: Jan 27, 2026 — Total buy-ins: ₪1550
  {
    startTime: new Date('2026-01-27T18:13:54.870Z'),
    endTime: new Date('2026-01-27T18:26:57.309Z'),
    players: [
      { name: 'Daniel Ziker', totalBuyIn: 150, rebuys: 1, profitLoss: 550 },
      { name: 'Nathy Stanislas', totalBuyIn: 50, rebuys: 0, profitLoss: 290 },
      { name: 'Miko de tunis', totalBuyIn: 100, rebuys: 0, profitLoss: 200 },
      { name: 'Tom Kilstein', totalBuyIn: 275, rebuys: 0, profitLoss: -65 },
      { name: 'Adam nakache', totalBuyIn: 100, rebuys: 0, profitLoss: -100 },
      { name: 'Benichou', totalBuyIn: 150, rebuys: 1, profitLoss: -150 },
      { name: 'Layani Noam', totalBuyIn: 225, rebuys: 1, profitLoss: -225 },
      { name: 'Dan guigui', totalBuyIn: 250, rebuys: 2, profitLoss: -250 },
      { name: 'Maor Dayan', totalBuyIn: 250, rebuys: 2, profitLoss: -250 },
    ],
  },
];
