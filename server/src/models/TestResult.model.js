import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'TestQuestion', required: true },
    // For single/multiple choice: indices of selected options
    selectedOptions: [{ type: Number }],
    // For text type
    textAnswer: { type: String, trim: true },
    isCorrect: { type: Boolean },
    score: { type: Number, default: 0 },
  },
  { _id: false }
);

const testResultSchema = new mongoose.Schema(
  {
    test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    answers: [answerSchema],
    score: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    isPassed: { type: Boolean, default: false },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date },
    timeSpent: { type: Number, default: 0 }, // seconds
  },
  { timestamps: true }
);

// One attempt per student per test (can be relaxed if retakes needed)
testResultSchema.index({ test: 1, student: 1 }, { unique: true });
testResultSchema.index({ student: 1 });
testResultSchema.index({ test: 1, isPassed: 1 });
testResultSchema.index({ group: 1 });

export default mongoose.model('TestResult', testResultSchema);
