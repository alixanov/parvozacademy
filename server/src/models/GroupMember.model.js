import mongoose from 'mongoose';

const groupMemberSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['active', 'paused', 'graduated', 'expelled'],
      default: 'active',
    },
    note: { type: String, trim: true },
    // Auto-set to true when a payment due date has passed and payment is still 'debt'
    paymentBlocked: { type: Boolean, default: false },
    // Admin manually grants access despite paymentBlocked (overrides auto-block)
    manualAccessGranted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One student per group
groupMemberSchema.index({ group: 1, student: 1 }, { unique: true });
groupMemberSchema.index({ student: 1 });
groupMemberSchema.index({ group: 1, status: 1 });

export default mongoose.model('GroupMember', groupMemberSchema);
