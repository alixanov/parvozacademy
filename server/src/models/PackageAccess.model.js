import mongoose from 'mongoose';

/**
 * Records a student's access to a Package.
 * Created when:
 *   1. Admin manually grants access
 *   2. Future: automatic payment integration
 */
const packageAccessSchema = new mongoose.Schema(
  {
    student:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    package:  { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
    grantedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User'    }, // admin / system
    paymentAmount: { type: Number, default: 0, min: 0 },
    note:     { type: String, default: '' },
    status:   { type: String, enum: ['active', 'revoked'], default: 'active' },
    revokedAt:{ type: Date },
  },
  { timestamps: true },
);

packageAccessSchema.index({ student: 1 });
packageAccessSchema.index({ package: 1 });
packageAccessSchema.index({ student: 1, package: 1 }, { unique: true });

export default mongoose.model('PackageAccess', packageAccessSchema);
