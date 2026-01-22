import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ICashout {
  gameParticipantId: Types.ObjectId;
  amount: number;
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
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      validate: {
        validator: function (value: Date) {
          // Allow 5 minutes in the future to account for clock drift
          return value <= new Date(Date.now() + 5 * 60 * 1000);
        },
        message: 'Timestamp cannot be in the future',
      },
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
