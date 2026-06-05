import mongoose from 'mongoose';

const submissionFileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String },
  },
  { _id: false }
);

const homeworkSubmissionSchema = new mongoose.Schema(
  {
    homework: { type: mongoose.Schema.Types.ObjectId, ref: 'Homework', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    files: [submissionFileSchema],
    comment: { type: String, trim: true },
    score: { type: Number, min: 0 },
    feedback: { type: String, trim: true },
    status: {
      type: String,
      enum: ['submitted', 'late', 'graded'],
      default: 'submitted',
    },
    submittedAt: { type: Date, default: Date.now },
    gradedAt: { type: Date },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// One submission per student per homework
homeworkSubmissionSchema.index({ homework: 1, student: 1 }, { unique: true });
homeworkSubmissionSchema.index({ student: 1 });
homeworkSubmissionSchema.index({ homework: 1, status: 1 });
homeworkSubmissionSchema.index({ group: 1 });

export default mongoose.model('HomeworkSubmission', homeworkSubmissionSchema);
