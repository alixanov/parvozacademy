import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: {
      uz: { type: String, required: true, trim: true },
      ru: { type: String, required: true, trim: true },
    },
    description: {
      uz: { type: String, trim: true },
      ru: { type: String, trim: true },
    },
    order: { type: Number, required: true, min: 1 },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

moduleSchema.index({ course: 1, order: 1 });
moduleSchema.index({ course: 1, isPublished: 1 });

export default mongoose.model('Module', moduleSchema);
