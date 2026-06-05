/**
 * Seed script — creates the Super Admin and default academy Settings.
 * Usage: node seed.js   (or: npm run seed)
 */

import 'dotenv/config';
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGODB_URI);
console.log('✓ MongoDB connected');

import User     from './src/models/User.model.js';
import Settings from './src/models/Settings.model.js';

// ── Super Admin ────────────────────────────────────────────────────────────────
const name     = process.env.SUPER_ADMIN_NAME     ?? 'Мадина Бахриддинова';
const phone    = process.env.SUPER_ADMIN_PHONE    ?? '+998931567447';
const password = process.env.SUPER_ADMIN_PASSWORD ?? 'Madinaacademyadmin';

const existing = await User.findOne({ role: 'admin' });

if (existing) {
  // Always sync password + passwordPlain from env so changing SUPER_ADMIN_PASSWORD takes effect
  existing.password      = password;   // pre-save hook will re-hash
  existing.passwordPlain = password;
  existing.phone         = phone;
  await existing.save();
  console.log(`✓ Admin password updated: ${existing.name} (${phone})`);
  console.log(`  New password: ${password}`);
} else {
  await User.create({ name, phone, password, passwordPlain: password, role: 'admin', isActive: true });
  console.log('✓ Super Admin created');
  console.log(`  Name:     ${name}`);
  console.log(`  Phone:    ${phone}`);
  console.log(`  Password: ${password}`);
  console.log('  Login:    use phone + password above');
}

// ── Default Settings ───────────────────────────────────────────────────────────
const existingSettings = await Settings.findOne();

if (existingSettings) {
  console.log('ℹ  Settings already exist');
} else {
  await Settings.create({
    academyName:   'PARVOZ ACADEMY',
    phones:        [phone],
    monthlyFee:    500000,
    currency:      'UZS',
    paymentDueDay: 5,
  });
  console.log('✓ Default Settings created');
}

await mongoose.disconnect();
console.log('✓ Done.');
process.exit(0);
