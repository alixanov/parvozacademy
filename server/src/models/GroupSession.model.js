import mongoose from 'mongoose';

/**
 * GroupSession — one live class event for a Group.
 *
 * Lifecycle:
 *   scheduled → (teacher sends link) → live → completed
 *                                            → cancelled
 *
 * NOT to be confused with the `Lesson` model, which stores course content
 * (videos, PDFs, quiz questions). GroupSession is the calendar event where
 * teacher meets students in real time.
 */

const materialSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true },
    url:      { type: String, required: true },
    publicId: { type: String },
    type: {
      type: String,
      enum: ['pdf', 'doc', 'video', 'link', 'image', 'archive', 'other'],
      default: 'other',
    },
  },
  { _id: false },
);

const groupSessionSchema = new mongoose.Schema(
  {
    group:   { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },

    /** Calendar date of the session (time-agnostic — combine with startTime for exact moment) */
    date:      { type: Date,   required: true },
    startTime: { type: String, match: /^\d{2}:\d{2}$/ }, // HH:MM from group schedule
    endTime:   { type: String, match: /^\d{2}:\d{2}$/ },

    /** What topic is planned / covered */
    topic: { type: String, trim: true },

    status: {
      type:    String,
      enum:    ['scheduled', 'live', 'completed', 'cancelled'],
      default: 'scheduled',
    },

    /** Join link sent by teacher before the session */
    lessonLink: {
      url:  { type: String, default: '' },
      type: {
        type: String,
        enum: ['zoom', 'google_meet', 'youtube', 'telegram', 'other'],
      },
    },
    lessonLinkSentAt: { type: Date },

    /** Actual timestamps */
    startedAt:   { type: Date },
    completedAt: { type: Date },

    /** Materials added by teacher after the session */
    materials: [materialSchema],

    /** Free-form notes (teacher private, visible to admin) */
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

// Queries: "give me all sessions for group X sorted by date"
groupSessionSchema.index({ group: 1, date: 1 });
// Teacher dashboard: "give me today's sessions for teacher Y"
groupSessionSchema.index({ teacher: 1, date: 1 });
// Admin / analytics: status-based queries
groupSessionSchema.index({ date: 1, status: 1 });
// Uniqueness: one session per (group, date, startTime) — avoids duplicates on regeneration
groupSessionSchema.index({ group: 1, date: 1, startTime: 1 }, { unique: true });

export default mongoose.model('GroupSession', groupSessionSchema);
