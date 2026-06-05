import mongoose from 'mongoose';

const tariffPlanSchema = new mongoose.Schema(
  {
    key: {
      type:     String,
      unique:   true,
      required: true,
      trim:     true,
    },
    name: {
      uz: { type: String, default: '' },
      ru: { type: String, required: true },
    },
    description: {
      uz: { type: String, default: '' },
      ru: { type: String, default: '' },
    },
    defaultPrice: { type: Number, default: 0, min: 0 },
    features:     [{ type: String, trim: true }],   // RU features
    featuresUz:   [{ type: String, trim: true }],   // UZ features (optional)
    color:        { type: String, default: '#1976D2' },
    isActive:     { type: Boolean, default: true },
    popular:      { type: Boolean, default: false },
    // Тип тарифа: обычный | индивидуальный пакет
    type: {
      type:    String,
      enum:    ['regular', 'individual_package'],
      default: 'regular',
    },
    // Только для individual_package
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
  },
  { timestamps: true },
);

export default mongoose.model('TariffPlan', tariffPlanSchema);
