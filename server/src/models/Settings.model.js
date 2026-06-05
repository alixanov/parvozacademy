import mongoose from 'mongoose';

const workingHoursSchema = new mongoose.Schema(
  {
    open: { type: String, match: /^\d{2}:\d{2}$/ },
    close: { type: String, match: /^\d{2}:\d{2}$/ },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    // Singleton guard — only one Settings document ever exists
    _singleton: { type: String, default: 'global', unique: true },

    // Academy identity
    academyName: { type: String, default: 'PARVOZ ACADEMY', trim: true },
    logo: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },

    // Contact
    phones: [{ type: String }],
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true },

    // Socials
    telegram: { type: String, trim: true },
    instagram: { type: String, trim: true },
    youtube: { type: String, trim: true },
    website: { type: String, trim: true },

    // Payment config
    monthlyFee: { type: Number, default: 0 },
    currency: { type: String, default: 'UZS' },
    paymentDueDay: { type: Number, default: 10, min: 1, max: 28 },

    // Реквизиты для оплаты (показываются клиенту при подаче заявки)
    paymentCards: [
      {
        bank:       { type: String, trim: true },  // 'Uzcard', 'Humo', 'Visa' ...
        cardNumber: { type: String, trim: true },  // '8600 1234 5678 9012'
        cardHolder: { type: String, trim: true },  // 'PARVOZ ACADEMY'
        _id: false,
      },
    ],
    paymentInstruction: {
      type: String,
      trim: true,
      default: "To'lov amalga oshirgach, chekni yuklang va arizangizni yuboring.",
    },

    // Working hours
    workingHours: {
      weekdays: { type: workingHoursSchema, default: {} },
      saturday: { type: workingHoursSchema, default: {} },
    },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Static helper — always returns the single document, creating it if needed
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ _singleton: 'global' });
  if (!settings) settings = await this.create({});
  return settings;
};

export default mongoose.model('Settings', settingsSchema);
