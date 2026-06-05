import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true },
    publicId: { type: String },
    type: {
      type: String,
      enum: ['pdf', 'doc', 'image', 'archive', 'other'],
      default: 'other',
    },
  },
  { _id: false }
);

const lessonSchema = new mongoose.Schema(
  {
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: {
      uz: { type: String, required: true, trim: true },
      ru: { type: String, required: true, trim: true },
    },
    description: {
      uz: { type: String, trim: true },
      ru: { type: String, trim: true },
    },
    video: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
      duration: { type: Number, default: 0 }, // seconds
    },
    materials: [materialSchema],
    order: { type: Number, required: true, min: 1 },
    isPublished: { type: Boolean, default: false },
    isFree: { type: Boolean, default: false }, // preview lesson
  },
  { timestamps: true }
);

lessonSchema.index({ module: 1, order: 1 });
lessonSchema.index({ course: 1 });
lessonSchema.index({ course: 1, isPublished: 1 });

export default mongoose.model('Lesson', lessonSchema);
