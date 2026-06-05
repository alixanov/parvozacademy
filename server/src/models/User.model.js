import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name:   { type: String, required: true, trim: true }, // primary (uz fallback)
    nameUz: { type: String, trim: true },               // Uzbek name
    nameRu: { type: String, trim: true },               // Russian name
    // email optional — login is by phone
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password:      { type: String, required: true, select: false },
    passwordPlain: { type: String, default: '' },   // plain-text copy (for admin view)
    role: {
      type: String,
      enum: ['admin', 'teacher', 'student'],
      default: 'student',
    },
    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    isActive: { type: Boolean, default: true },
    dateOfBirth: { type: Date },
    address: { type: String, trim: true },
    telegram: { type: String, trim: true },

    // Student-specific
    studentId: { type: String, sparse: true },

    // Teacher-specific
    color:      { type: String, default: '' },   // brand color for UI cards
    subject: { type: String, trim: true },
    experience: { type: Number, min: 0 },
    bio: { type: String },
    achievements: [{ type: String }],
    salary: { type: Number, min: 0 },
    rating: { type: Number, min: 0, max: 5, default: 5 },

    // Permissions (teacher)
    canCreatePackages: { type: Boolean, default: false }, // admin grants access to Individual Package feature

    lastLogin: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ phone: 1 }, { sparse: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Strip password from all serializations
userSchema.set('toJSON', {
  transform(_, ret) {
    delete ret.password;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
