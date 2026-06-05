import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['info', 'warning', 'success', 'urgent'],
      default: 'info',
    },
    category: {
      type: String,
      enum: ['homework', 'payment', 'test', 'attendance', 'system', 'announcement', 'lesson'],
      default: 'system',
    },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    link: { type: String }, // internal route or external URL
    metadata: { type: mongoose.Schema.Types.Mixed }, // flexible payload
  },
  { timestamps: true }
);

// Required indexes from spec
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ recipient: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
