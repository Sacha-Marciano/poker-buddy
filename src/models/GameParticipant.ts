import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IGameParticipant {
  gameId: Types.ObjectId;
  playerId: Types.ObjectId;
  joinedAt: Date;
  createdAt: Date;
}

export interface IGameParticipantDocument extends IGameParticipant, Document {}

const gameParticipantSchema = new Schema<IGameParticipantDocument>(
  {
    gameId: {
      type: Schema.Types.ObjectId,
      ref: 'Game',
      required: [true, 'Game ID is required'],
    },
    playerId: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      required: [true, 'Player ID is required'],
    },
    joinedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'gameParticipants',
  }
);

// Indexes - compound unique to prevent duplicate player-game entries
gameParticipantSchema.index({ gameId: 1, playerId: 1 }, { unique: true });
gameParticipantSchema.index({ playerId: 1 });
gameParticipantSchema.index({ gameId: 1 });

const GameParticipant: Model<IGameParticipantDocument> =
  mongoose.models.GameParticipant ||
  mongoose.model<IGameParticipantDocument>('GameParticipant', gameParticipantSchema);

export default GameParticipant;
