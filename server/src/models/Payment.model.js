import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'UZS' },
    month: { type: String, required: true, match: /^\d{4}-\d{2}$/ }, // YYYY-MM
    status: {
      type: String,
      // debt    → to'lanmagan (default)
      // pending → chek yuklangan, admin tasdig'ini kutmoqda
      // paid    → admin tasdiqlagan, to'lov qabul qilindi
      // partial → qisman to'langan
      enum: ['debt', 'pending', 'paid', 'partial'],
      default: 'debt',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'transfer', 'online'],
    },
    paidAmount: { type: Number, default: 0, min: 0 }, // for partial payments
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receiptUrl: { type: String },
    note: { type: String, trim: true },
    paidAt: { type: Date },
    dueDate: { type: Date, required: true },
    // Явные границы оплаченного периода
    periodStart: { type: Date },
    periodEnd:   { type: Date },
    // Ссылка на заявку о зачислении (если оплата создана через enrollment)
    enrollment: { type: mongoose.Schema.Types.ObjectId, ref: 'EnrollmentApplication' },
  },
  { timestamps: true }
);

paymentSchema.index({ student: 1, status: 1 });
paymentSchema.index({ student: 1 });
paymentSchema.index({ group: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ month: 1 });
paymentSchema.index({ dueDate: 1 });
paymentSchema.index({ student: 1, group: 1, month: 1 }, { unique: true });

export default mongoose.model('Payment', paymentSchema);
