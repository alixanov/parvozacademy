import mongoose from 'mongoose';

/**
 * Individual Package — self-contained learning kit sold to students.
 * Teacher creates modules; each module has description + file + YouTube link.
 * No live sessions — purely async / on-demand.
 */

const multiLangSchema = {
  uz: { type: String, default: '' },
  ru: { type: String, default: '' },
};

const quizQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, default: '' },
    options:  { type: [String], default: ['', '', '', ''] }, // 4 variants A B C D
    correct:  { type: Number, default: 0, min: 0, max: 3 }, // index of correct answer
  },
  { _id: true },
);

const packageModuleSchema = new mongoose.Schema(
  {
    order:       { type: Number, default: 0 },
    title:       { uz: String, ru: String },
    description: { uz: { type: String, default: '' }, ru: { type: String, default: '' } },
    file: {
      name:     { type: String, default: '' },
      url:      { type: String, default: '' },
      publicId: { type: String, default: '' },
      type:     { type: String, enum: ['pdf', 'doc', 'docx', 'pptx', 'other'], default: 'pdf' },
      size:     { type: Number, default: 0 }, // bytes
    },
    link:        { type: String, default: '' },
    videoUrl:    { type: String, default: '' }, // YouTube URL
    videoFile:   { type: String, default: '' }, // uploaded video file URL (T3)
    isPublished: { type: Boolean, default: true },
    quiz:        { type: [quizQuestionSchema], default: [] }, // up to 10 test questions
  },
  { _id: true, timestamps: true },
);

const packageSchema = new mongoose.Schema(
  {
    title:       { uz: { type: String, required: true }, ru: { type: String, default: '' } },
    description: { uz: { type: String, default: '' },   ru: { type: String, default: '' } },

    teacher:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course:     { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    tariffPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'TariffPlan', default: null },

    price: {
      amount:   { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'UZS' },
    },

    thumbnail:  { type: String, default: '' },

    /**
     * draft      → created, being filled, not yet visible to students
     * published  → available for sale / access grant
     * archived   → removed from sale, existing access still works
     */
    status: {
      type:    String,
      enum:    ['draft', 'published', 'archived'],
      default: 'draft',
    },

    modules: [packageModuleSchema],

    // Denormalized counters
    purchaseCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

packageSchema.index({ teacher: 1 });
packageSchema.index({ status: 1 });
packageSchema.index({ 'price.amount': 1 });

export default mongoose.model('Package', packageSchema);
