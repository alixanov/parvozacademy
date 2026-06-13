import { GroupSession, GroupMember } from '../models/index.js';
import * as notifSvc from '../modules/notifications/notifications.service.js';

/**
 * Runs every minute.
 * Finds sessions that:
 *   - start in 13–17 minutes from now (window to catch the exact 15-min mark)
 *   - have a lessonLink set
 *   - have NOT yet had a reminder sent (reminderSent: false)
 * Sends a push notification to all active students in that group.
 */
async function checkAndNotify() {
  try {
    const now      = new Date();
    const from     = new Date(now.getTime() + 13 * 60 * 1000); // 13 min ahead
    const to       = new Date(now.getTime() + 17 * 60 * 1000); // 17 min ahead

    const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

    // Find sessions today where startTime falls in [from, to] window
    const sessions = await GroupSession.find({
      date:         { $gte: new Date(todayStr), $lt: new Date(todayStr + 'T23:59:59Z') },
      'lessonLink.url': { $exists: true, $ne: '' },
      reminderSent: false,
      status:       { $in: ['scheduled', 'live'] },
    }).populate('group', 'name');

    for (const session of sessions) {
      // Parse startTime "HH:MM" and combine with session date to get exact DateTime
      if (!session.startTime) continue;
      const [hh, mm] = session.startTime.split(':').map(Number);
      const sessionStart = new Date(session.date);
      sessionStart.setHours(hh, mm, 0, 0);

      // Check if sessionStart falls within the 13–17 min window
      if (sessionStart < from || sessionStart > to) continue;

      // Mark as sent FIRST to avoid duplicate notifications on retry
      session.reminderSent = true;
      await session.save();

      // Get active students
      const members    = await GroupMember.find({ group: session.group._id, status: 'active' }, 'student');
      const studentIds = members.map((m) => m.student);
      if (!studentIds.length) continue;

      const groupName = (() => {
        const n = session.group?.name;
        if (!n) return 'Guruh';
        if (typeof n === 'object') return n.ru ?? n.uz ?? 'Guruh';
        return n;
      })();

      const platform = {
        zoom: 'Zoom', google_meet: 'Google Meet', youtube: 'YouTube Live',
        telegram: 'Telegram', other: 'Trансляция',
      }[session.lessonLink.type] ?? 'Dars';

      await Promise.allSettled(
        studentIds.map((sid) =>
          notifSvc.send({
            senderId:  session.teacher,
            title:     `⏰ 15 дақиқада дарс бошланади!`,
            message:   `${groupName} — ${session.startTime} да ${platform} орқали дарс. Ҳавола: ${session.lessonLink.url}`,
            type:      'warning',
            category:  'lesson',
            target:    { userId: sid },
            link:      session.lessonLink.url,
            metadata:  { sessionId: session._id, groupId: session.group._id },
          }),
        ),
      );

      console.log(`[lessonReminder] Sent 15-min reminder for session ${session._id} (${groupName} ${session.startTime})`);
    }
  } catch (err) {
    console.error('[lessonReminder] Error:', err.message);
  }
}

export function startLessonReminderJob() {
  // Run immediately on start, then every 60 seconds
  checkAndNotify();
  setInterval(checkAndNotify, 60 * 1000);
  console.log('[lessonReminder] 15-min reminder job started');
}
