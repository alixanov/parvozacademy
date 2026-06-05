import mongoose from 'mongoose';

const { Schema, Types } = mongoose;

/**
 * EnrollmentApplication — заявка на поступление от незарегистрированного клиента.
 *
 * Жизненный цикл:
 *   pending  →  approved  (автоматически создаётся аккаунт ученика + оплата)
 *   pending  →  rejected  (с причиной отказа)
 */
const enrollmentApplicationSchema = new Schema(
  {
    // ── Анкетные данные заявителя ────────────────────────────────
    fullName: { type: String, required: true, trim: true },
    phone:    { type: String, required: true, trim: true },

    // ── Выбор ───────────────────────────────────────────────────
    course:    { type: Types.ObjectId, ref: 'Course',  default: null }, // course OR package required
    package:   { type: Types.ObjectId, ref: 'Package', default: null }, // individual package purchase
    tariffKey: { type: String, trim: true, default: '' }, // 'online' | 'offline' | 'individual_offline' | 'individual_online' | 'individual_package'
    amount:    { type: Number, required: true, min: 0 },     // snapshot цены на момент заявки

    // ── Чек ─────────────────────────────────────────────────────
    receiptUrl: { type: String, required: true },
    receiptKey: { type: String },  // S3/T3-ключ для удаления при откате

    // ── Статус ──────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String, trim: true },

    // ── Обработка (заполняется админом) ─────────────────────────
    processedAt: { type: Date },
    processedBy: { type: Types.ObjectId, ref: 'User' },

    // ── Ссылки на созданные ресурсы (заполняются после approve) ─
    student: { type: Types.ObjectId, ref: 'User' },
    group:   { type: Types.ObjectId, ref: 'Group' },
    payment: { type: Types.ObjectId, ref: 'Payment' },
  },
  { timestamps: true },
);

enrollmentApplicationSchema.index({ status: 1, createdAt: -1 });
enrollmentApplicationSchema.index({ phone: 1 });
enrollmentApplicationSchema.index({ course: 1, status: 1 });

export default mongoose.model('EnrollmentApplication', enrollmentApplicationSchema);
