import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// token unique already declared on field; keep user lookup + TTL
refreshTokenSchema.index({ user: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('RefreshToken', refreshTokenSchema);
