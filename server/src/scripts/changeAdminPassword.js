import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('MONGODB_URI not set'); process.exit(1); }

await mongoose.connect(MONGODB_URI);

const User = mongoose.model('User', new mongoose.Schema({
  phone: String,
  name: String,
  role: String,
  password: String,
  isActive: Boolean,
}, { strict: false }));

const NEW_PASSWORD = '931567447';
const hashed = await bcrypt.hash(NEW_PASSWORD, 10);

const result = await User.updateOne(
  { role: 'admin' },
  { $set: { password: hashed } }
);

if (result.matchedCount === 0) {
  console.log('❌ Admin not found');
} else {
  console.log(`✅ Admin password updated to: ${NEW_PASSWORD}`);
}

await mongoose.disconnect();
