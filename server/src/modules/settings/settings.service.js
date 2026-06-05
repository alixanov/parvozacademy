import { Settings } from '../../models/index.js';

export async function get() {
  return Settings.getSettings();
}

export async function update(data, updatedBy) {
  const ALLOWED = [
    'academyName', 'logo', 'phones', 'email', 'address',
    'telegram', 'instagram', 'youtube', 'website',
    'monthlyFee', 'currency', 'paymentDueDay', 'workingHours',
    'paymentCards', 'paymentInstruction',
  ];

  const $set = { updatedBy };
  ALLOWED.forEach((key) => {
    if (data[key] !== undefined) $set[key] = data[key];
  });

  // findOneAndUpdate bypasses Mongoose change-detection entirely
  // — guaranteed to write arrays/subdocs to MongoDB
  return Settings.findOneAndUpdate(
    { _singleton: 'global' },
    { $set },
    { new: true, upsert: true, runValidators: false },
  );
}
