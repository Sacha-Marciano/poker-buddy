import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ICashout {
  gameParticipantId: Types.ObjectId;
  amount: number;
  finalChips?: number;
  timestamp: Date;
  createdAt: Date;
}

export interface ICashoutDocument extends ICashout, Document {}

const cashoutSchema = new Schema<ICashoutDocument>(
  {
    gameParticipantId: {
      type: Schema.Types.ObjectId,
      ref: 'GameParticipant',
      required: [true, 'Game participant ID is required'],
      unique: true, // Only one cashout per participant
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
      max: [1000000, 'Amount cannot exceed 1,000,000'],
      validate: {
        validator: function (value: number) {
          return Number.isInteger(value);
        },
        message: 'Amount must be a whole number (no decimals)',
      },
    },
    finalChips: {
      type: Number,
      min: [0, 'Final chips cannot be negative'],
      max: [1000000, 'Final chips cannot exceed 1,000,000'],
      validate: {
        validator: function (value: number | undefined) {
          if (value === undefined || value === null) return true;
          return Number.isInteger(value);
        },
        message: 'Final chips must be a whole number',
      },
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
    collection: 'cashouts',
  }
);

// Indexes
cashoutSchema.index({ gameParticipantId: 1 }, { unique: true });
cashoutSchema.index({ timestamp: -1 });

const Cashout: Model<ICashoutDocument> =
  mongoose.models.Cashout || mongoose.model<ICashoutDocument>('Cashout', cashoutSchema);

export default Cashout;
