import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IBuyIn {
  gameParticipantId: Types.ObjectId;
  amount: number;
  isRebuy: boolean;
  timestamp: Date;
  createdAt: Date;
}

export interface IBuyInDocument extends IBuyIn, Document {}

const buyInSchema = new Schema<IBuyInDocument>(
  {
    gameParticipantId: {
      type: Schema.Types.ObjectId,
      ref: 'GameParticipant',
      required: [true, 'Game participant ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be at least 1'],
      max: [1000000, 'Amount cannot exceed 1,000,000'],
      validate: {
        validator: function (value: number) {
          return Number.isInteger(value);
        },
        message: 'Amount must be a whole number (no decimals)',
      },
    },
    isRebuy: {
      type: Boolean,
      required: true,
      default: false,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      // TODO: TEMPORARY - validator removed to allow seeding historical data.
      // Re-enable this validator after seeding is complete:
      // validate: {
      //   validator: function (value: Date) {
      //     return value <= new Date(Date.now() + 5 * 60 * 1000);
      //   },
      //   message: 'Timestamp cannot be in the future',
      // },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'buyIns',
  }
);

// Indexes
buyInSchema.index({ gameParticipantId: 1, timestamp: -1 });
buyInSchema.index({ timestamp: -1 });

const BuyIn: Model<IBuyInDocument> =
  mongoose.models.BuyIn || mongoose.model<IBuyInDocument>('BuyIn', buyInSchema);

export default BuyIn;
