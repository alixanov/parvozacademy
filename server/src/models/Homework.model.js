import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String },
  },
  { _id: false }
);

const homeworkSchema = new mongoose.Schema(
  {
    /**
     * lesson  — links to a course content Lesson (optional when used for group sessions)
     * session — links to the live GroupSession after which this HW was assigned
     * At least one of them should be set (service-level validation).
     */
    lesson:  { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupSession' },
    group:   { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    dueDate: { type: Date, required: true },
    maxScore: { type: Number, default: 100, min: 1 },
    attachments: [attachmentSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

homeworkSchema.index({ lesson: 1 });
homeworkSchema.index({ group: 1 });
homeworkSchema.index({ teacher: 1 });
homeworkSchema.index({ group: 1, dueDate: 1 });

export default mongoose.model('Homework', homeworkSchema);
