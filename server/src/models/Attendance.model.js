import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true,
    },
    note: { type: String, trim: true },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    group:   { type: mongoose.Schema.Types.ObjectId, ref: 'Group',        required: true },
    /** session — live class (GroupSession). Preferred over the old `lesson` field. */
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupSession' },
    /** lesson — legacy: course content lesson (kept for backward compat) */
    lesson:  { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    date:     { type: Date, required: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    records: [attendanceRecordSchema],
  },
  { timestamps: true }
);

// One attendance sheet per group per date
attendanceSchema.index({ group: 1, date: 1 }, { unique: true });
attendanceSchema.index({ group: 1 });
attendanceSchema.index({ date: 1 });

export default mongoose.model('Attendance', attendanceSchema);
