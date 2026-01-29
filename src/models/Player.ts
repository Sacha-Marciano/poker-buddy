import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlayer {
  name: string;
  phone?: string;
  avatarColor?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlayerDocument extends IPlayer, Document {}

const playerSchema = new Schema<IPlayerDocument>(
  {
    name: {
      type: String,
      required: [true, 'Player name is required'],
      unique: true,
      trim: true,
      minlength: [1, 'Name must be at least 1 character'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters'],
    },
    avatarColor: {
      type: String,
      trim: true,
      maxlength: [7, 'Avatar color must be a valid hex color'],
      validate: {
        validator: function (value: string) {
          if (!value) return true;
          return /^#[0-9A-Fa-f]{6}$/.test(value);
        },
        message: 'Avatar color must be a valid hex color (e.g., #FF6B6B)',
      },
    },
    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'players',
  }
);

// Indexes
playerSchema.index({ name: 1 }, { unique: true });
playerSchema.index({ isDeleted: 1 });

// Prevent model recompilation in development
const Player: Model<IPlayerDocument> =
  mongoose.models.Player || mongoose.model<IPlayerDocument>('Player', playerSchema);

export default Player;
