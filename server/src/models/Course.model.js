import mongoose from 'mongoose';

const localizedString = {
  uz: { type: String, required: true, trim: true },
  ru: { type: String, required: true, trim: true },
};

const optionalLocalized = {
  uz: { type: String, default: '', trim: true },
  ru: { type: String, default: '', trim: true },
};

const courseSchema = new mongoose.Schema(
  {
    title: localizedString,
    description: optionalLocalized,
    subject: {
      type: String,
      enum: ['math', 'uzbek', 'history', 'english', 'it', 'other'],
      required: true,
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true,
    },
    // Тарифы — выбранные из TariffPlan (online / offline / individual)
    tariffs: [{
      key:      { type: String, trim: true },              // ссылка на TariffPlan.key
      name:     { type: String, required: true, trim: true },
      price:    { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'UZS' },
    }],
    price: {
      amount:   { type: Number, default: 0, min: 0 }, // мин. тариф (для сортировки)
      currency: { type: String, default: 'UZS' },
    },
    duration: { type: Number, required: true, min: 1 }, // months
    thumbnail: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPublished: { type: Boolean, default: true },  // автопубликация
    isActive: { type: Boolean, default: true },
    totalStudents: { type: Number, default: 0 },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    tags: [{ type: String, trim: true }],
    color:   { type: String, default: '' },   // hex color, e.g. '#1976D2'
    iconKey: { type: String, default: '' },   // icon key, e.g. 'functions'
  },
  { timestamps: true }
);

courseSchema.index({ subject: 1 });
courseSchema.index({ teacher: 1 });
courseSchema.index({ isPublished: 1 });
courseSchema.index({ isActive: 1 });
courseSchema.index({ subject: 1, isPublished: 1, isActive: 1 });

export default mongoose.model('Course', courseSchema);
