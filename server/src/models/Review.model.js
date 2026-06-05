import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    author: {
      name:   { type: String, required: true, trim: true },
      avatar: { type: String, default: '' },
      role:   { type: String, default: 'student' },
    },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text:   { type: String, required: true, trim: true, maxlength: 1000 },
    status: {
      type:    String,
      enum:    ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    isPublished: { type: Boolean, default: false },
    reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt:  { type: Date, default: null },
  },
  { timestamps: true }
);

reviewSchema.index({ status: 1 });
reviewSchema.index({ course: 1 });
reviewSchema.index({ isPublished: 1, createdAt: -1 });

export default mongoose.model('Review', reviewSchema);
