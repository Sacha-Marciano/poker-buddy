import mongoose, { Schema, Document, Model } from 'mongoose';

export type GameStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface IGame {
  location?: string;
  startTime: Date;
  endTime?: Date;
  minimumCashoutTime: Date;
  status: GameStatus;
  discrepancyNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGameDocument extends IGame, Document {}

const gameSchema = new Schema<IGameDocument>(
  {
    location: {
      type: String,
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters'],
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
      // TODO: TEMPORARY - validator removed to allow seeding historical data.
      // Re-enable this validator after seeding is complete:
      // validate: {
      //   validator: function (value: Date) {
      //     return value <= new Date(Date.now() + 5 * 60 * 1000);
      //   },
      //   message: 'Start time cannot be in the future',
      // },
    },
    endTime: {
      type: Date,
      validate: {
        validator: function (value: Date | undefined) {
          if (!value) return true;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const doc = this as any;
          return value > doc.startTime;
        },
        message: 'End time must be after start time',
      },
    },
    minimumCashoutTime: {
      type: Date,
      required: [true, 'Minimum cashout time is required'],
      validate: {
        validator: function (value: Date) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const doc = this as any;
          return value >= doc.startTime;
        },
        message: 'Minimum cashout time must be at or after start time',
      },
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['IN_PROGRESS', 'COMPLETED'],
        message: 'Status must be IN_PROGRESS or COMPLETED',
      },
      default: 'IN_PROGRESS',
    },
    discrepancyNotes: {
      type: String,
      maxlength: [500, 'Discrepancy notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
    collection: 'games',
  }
);

// Indexes
gameSchema.index({ startTime: -1 });
gameSchema.index({ status: 1 });
gameSchema.index({ status: 1, startTime: -1 });

// Note: Status change validation (COMPLETED -> IN_PROGRESS) is handled in API layer
// to prevent completed games from being modified

const Game: Model<IGameDocument> =
  mongoose.models.Game || mongoose.model<IGameDocument>('Game', gameSchema);

export default Game;
