import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './src/config/db.js';
import { Package, PackageAccess, User, Group, GroupMember } from './src/models/index.js';

await connectDB();

const PKG_ID = '6a1ef82e16412a6ef8334691'; // UI/UX

// Restore all revoked accesses to active
const restored = await PackageAccess.updateMany(
  { package: PKG_ID, status: 'revoked' },
  { $set: { status: 'active', revokedAt: null } }
);
console.log(`✅ Restored ${restored.modifiedCount} access record(s) to active`);

// Get all active accesses
const accesses = await PackageAccess.find({ package: PKG_ID, status: 'active' })
  .populate('student', 'name phone');
console.log(`Active accesses: ${accesses.length}`);

const pkg = await Package.findById(PKG_ID).populate('teacher', 'name');
const pkgTitle = pkg.title?.uz ?? pkg.title?.ru ?? 'Individual paket';

// Find or create group
let pkgGroup = await Group.findOne({ package: PKG_ID });
if (!pkgGroup) {
  const teacherId = pkg.teacher?._id ?? pkg.teacher;
  pkgGroup = await Group.create({
    name:        `${pkgTitle} — Inд. guruh`,
    course:      pkg.course ?? null,
    teacher:     teacherId,
    package:     PKG_ID,
    type:        'individual_package',
    price:       { amount: 0, currency: 'UZS' },
    maxStudents: 9999,
    status:      'active',
    isActive:    true,
    startDate:   new Date(),
  });
  console.log(`✅ Group created: ${pkgGroup.name}`);
} else {
  console.log(`✅ Group exists: ${pkgGroup.name}`);
}

// Add all active buyers to the group
for (const access of accesses) {
  const studentId = access.student?._id;
  const studentName = access.student?.name ?? '?';
  if (!studentId) continue;

  const existing = await GroupMember.findOne({ group: pkgGroup._id, student: studentId });
  if (!existing) {
    await GroupMember.create({ group: pkgGroup._id, student: studentId });
    console.log(`✅ Added: ${studentName}`);
  } else if (existing.status !== 'active') {
    existing.status = 'active';
    await existing.save();
    console.log(`✅ Re-activated: ${studentName}`);
  } else {
    console.log(`⏭  Already in group: ${studentName}`);
  }
}

console.log('\n✅ Done! Open localhost:3001/admin/groups');
await mongoose.disconnect();
