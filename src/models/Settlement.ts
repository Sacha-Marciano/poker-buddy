import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Settlement document - tracks money transfers between players after game completion
 */
export interface ISettlementDocument extends Document {
  _id: mongoose.Types.ObjectId;
  gameId: mongoose.Types.ObjectId;
  fromPlayerId: mongoose.Types.ObjectId;
  toPlayerId: mongoose.Types.ObjectId;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

const settlementSchema = new Schema<ISettlementDocument>(
  {
    gameId: {
      type: Schema.Types.ObjectId,
      ref: 'Game',
      required: [true, 'Game ID is required'],
      index: true,
    },
    fromPlayerId: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      required: [true, 'From player ID is required'],
    },
    toPlayerId: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      required: [true, 'To player ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Amount must be a whole number',
      },
    },
  },
  {
    timestamps: true,
    collection: 'settlements',
  }
);

// Indexes
settlementSchema.index({ gameId: 1, fromPlayerId: 1 });
settlementSchema.index({ gameId: 1, toPlayerId: 1 });

const Settlement: Model<ISettlementDocument> =
  mongoose.models.Settlement ||
  mongoose.model<ISettlementDocument>('Settlement', settlementSchema);

export default Settlement;
