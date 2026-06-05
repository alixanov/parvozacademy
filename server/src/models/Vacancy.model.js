import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    resumeUrl: { type: String, required: true },
    resumePublicId: { type: String },
    coverLetter: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'accepted', 'rejected'],
      default: 'pending',
    },
    appliedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const vacancySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    subject: { type: String, trim: true },
    requirements: [{ type: String }],
    salary: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: 'UZS' },
    },
    type: {
      type: String,
      enum: ['full-time', 'part-time', 'internship'],
      default: 'full-time',
    },
    isActive: { type: Boolean, default: true },
    applications: [applicationSchema],
  },
  { timestamps: true }
);

vacancySchema.index({ isActive: 1 });
vacancySchema.index({ subject: 1 });
vacancySchema.index({ isActive: 1, subject: 1 });

export default mongoose.model('Vacancy', vacancySchema);
