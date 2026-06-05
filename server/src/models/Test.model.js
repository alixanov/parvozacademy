import mongoose from 'mongoose';

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    duration: { type: Number, required: true, min: 1 }, // minutes
    maxScore: { type: Number, default: 100 },
    passingScore: { type: Number, default: 60 },
    type: {
      type: String,
      enum: ['lesson', 'module', 'placement', 'final'],
      required: true,
    },
    isPublished: { type: Boolean, default: false },
    startTime: { type: Date },  // null = available immediately
    endTime: { type: Date },    // null = no deadline
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },
    totalQuestions: { type: Number, default: 0 }, // denormalized for performance
  },
  { timestamps: true }
);

testSchema.index({ course: 1 });
testSchema.index({ group: 1 });
testSchema.index({ teacher: 1 });
testSchema.index({ type: 1, isPublished: 1 });

export default mongoose.model('Test', testSchema);
