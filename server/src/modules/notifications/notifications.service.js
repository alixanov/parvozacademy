import { Notification, User } from '../../models/index.js';
import { AppError } from '../../utils/response.utils.js';
import { getIO } from '../../config/socket.js';

export async function getForUser(userId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  const [items, total, unread] = await Promise.all([
    Notification.find({ recipient: userId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ recipient: userId }),
    Notification.countDocuments({ recipient: userId, isRead: false }),
  ]);
  return { items, total, unread, page, pages: Math.ceil(total / limit) };
}

export async function markRead(notifId, userId) {
  const notif = await Notification.findOneAndUpdate(
    { _id: notifId, recipient: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  if (!notif) throw new AppError('Notification not found', 404);
  return notif;
}

export async function markAllRead(userId) {
  await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
}

export async function send({ senderId, title, message, type = 'info', category = 'announcement', target, link, metadata }) {
  // target: 'all' | 'students' | 'teachers' | { role } | { userId }
  let recipients = [];

  if (target === 'all') {
    const users = await User.find({ isActive: true }, '_id');
    recipients = users.map((u) => u._id);
  } else if (target === 'students' || target === 'teachers') {
    const role = target === 'students' ? 'student' : 'teacher';
    const users = await User.find({ role, isActive: true }, '_id');
    recipients = users.map((u) => u._id);
  } else if (target?.userId) {
    recipients = [target.userId];
  } else if (target?.role) {
    const users = await User.find({ role: target.role, isActive: true }, '_id');
    recipients = users.map((u) => u._id);
  }

  if (!recipients.length) return [];

  const docs = await Notification.insertMany(
    recipients.map((recipientId) => ({
      recipient: recipientId,
      sender: senderId,
      title,
      message,
      type,
      category,
      link,
      metadata,
    }))
  );

  // Real-time push via Socket.IO
  try {
    const io = getIO();
    docs.forEach((notif) => {
      io.to(`user:${notif.recipient}`).emit('notification', notif);
    });
  } catch {
    // Socket not initialized in test env — ignore
  }

  return docs;
}

export async function deleteOne(notifId, userId) {
  const notif = await Notification.findOneAndDelete({ _id: notifId, recipient: userId });
  if (!notif) throw new AppError('Notification not found', 404);
}
