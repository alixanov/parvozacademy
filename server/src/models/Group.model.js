import mongoose from 'mongoose';

const scheduleSlotSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0=Sun … 6=Sat
    startTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ }, // HH:MM
    endTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
  },
  { _id: false }
);

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // course is optional for individual_package groups (they are tied to a Package, not a Course)
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // package — set only for auto-created individual_package groups
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', default: null },
    room: { type: String, trim: true },
    schedule: [scheduleSlotSchema],
    // startDate is null until admin explicitly activates the group
    startDate: { type: Date, default: null },
    endDate:   { type: Date, default: null },
    // activatedAt — timestamp when admin first activated this group
    activatedAt: { type: Date, default: null },
    maxStudents: { type: Number, default: 20, min: 1 },
    price: {
      amount: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'UZS' },
    },
    type: {
      type: String,
      enum: ['offline', 'online', 'individual_offline', 'individual_online', 'individual_package'],
      required: true,
    },
    /**
     * status lifecycle:
     *   inactive  → created, students can be added, course not started
     *   active    → course running, payment cycle counting
     *   completed → all months passed, course finished
     *
     * isActive kept in sync for backward-compat queries.
     */
    status: {
      type:    String,
      enum:    ['inactive', 'active', 'completed'],
      default: 'inactive',
    },
    isActive: { type: Boolean, default: false }, // mirror of (status === 'active')
  },
  { timestamps: true }
);

groupSchema.index({ teacher: 1 });
groupSchema.index({ course: 1 });
groupSchema.index({ package: 1 });
groupSchema.index({ status: 1 });
groupSchema.index({ isActive: 1 });
groupSchema.index({ teacher: 1, isActive: 1 });

export default mongoose.model('Group', groupSchema);
