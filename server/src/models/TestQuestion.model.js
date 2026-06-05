import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

const testQuestionSchema = new mongoose.Schema(
  {
    test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    question: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['single', 'multiple', 'text'],
      default: 'single',
    },
    options: [optionSchema], // empty for type=text
    correctAnswer: { type: String, trim: true }, // for type=text
    score: { type: Number, default: 1, min: 0 },
    order: { type: Number, required: true },
    image: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

testQuestionSchema.index({ test: 1, order: 1 });

export default mongoose.model('TestQuestion', testQuestionSchema);
