import { getPool, sql } from '../config/database.js';
import { sendInactivityReminderEmail } from './emailService.js';

const HEARTBEAT_INTERVAL_SECONDS = Math.max(
  Number(process.env.ACTIVITY_HEARTBEAT_INTERVAL_SECONDS || 10),
  1
);
const INACTIVITY_REMINDER_DAYS = Math.max(
  Number(process.env.INACTIVITY_REMINDER_DAYS ?? 5),
  0
);
const INACTIVITY_SCAN_INTERVAL_HOURS = Math.max(
  Number(process.env.INACTIVITY_SCAN_INTERVAL_HOURS || 24),
  1
);
// Optional override in minutes for quick testing (e.g. INACTIVITY_SCAN_INTERVAL_MINUTES=2).
// When set and >= 1, it takes precedence over INACTIVITY_SCAN_INTERVAL_HOURS.
const INACTIVITY_SCAN_INTERVAL_MINUTES = Math.max(
  Number(process.env.INACTIVITY_SCAN_INTERVAL_MINUTES || 0),
  0
);

let hasEnsuredActivityColumns = false;
let inactivityReminderJob = null;

export const ensureActivityTrackingColumns = async () => {
  if (hasEnsuredActivityColumns) {
    return;
  }

  const pool = await getPool();
  await pool.request().query(`
    IF COL_LENGTH('users', 'last_active') IS NULL
    BEGIN
      ALTER TABLE users ADD last_active DATETIME2 NULL;
    END;

    IF COL_LENGTH('users', 'last_inactive_reminder_at') IS NULL
    BEGIN
      ALTER TABLE users ADD last_inactive_reminder_at DATETIME2 NULL;
    END;

    IF NOT EXISTS (
      SELECT 1
      FROM sys.indexes
      WHERE name = 'idx_users_last_active'
        AND object_id = OBJECT_ID('users')
    )
    BEGIN
      CREATE INDEX idx_users_last_active ON users(last_active);
    END;
  `);

  hasEnsuredActivityColumns = true;
};

export const updateUserLastActive = async (userId) => {
  await ensureActivityTrackingColumns();

  const pool = await getPool();
  const result = await pool.request()
    .input('user_id', sql.UniqueIdentifier, userId)
    .input('heartbeat_interval_seconds', sql.Int, HEARTBEAT_INTERVAL_SECONDS)
    .query(`
      UPDATE users
      SET
        last_active = GETDATE(),
        updated_at = GETDATE(),
        last_inactive_reminder_at = NULL
      WHERE id = @user_id
        AND (
          last_active IS NULL
          OR DATEDIFF(SECOND, last_active, GETDATE()) >= @heartbeat_interval_seconds
        );

      SELECT @@ROWCOUNT AS affected_rows;
    `);

  return (result.recordset?.[0]?.affected_rows || 0) > 0;
};

export const runInactivityReminderScan = async () => {
  await ensureActivityTrackingColumns();

  const pool = await getPool();

  // Atomically claim users to remind so that multiple backend instances or
  // overlapping scans never send duplicate emails for the same user.
  // We bump last_inactive_reminder_at first, OUTPUT the claimed rows, then
  // try to send the email. If sending fails we revert the timestamp so the
  // next scan can retry.
  const claimed = await pool.request()
    .input('inactivity_days', sql.Int, INACTIVITY_REMINDER_DAYS)
    .query(`
      UPDATE u
      SET last_inactive_reminder_at = GETDATE()
      OUTPUT inserted.id, inserted.email, inserted.full_name
      FROM users u
      WHERE email IS NOT NULL
        AND last_active IS NOT NULL
        AND DATEDIFF(DAY, last_active, GETDATE()) >= @inactivity_days
        AND (
          last_inactive_reminder_at IS NULL
          OR last_inactive_reminder_at < last_active
        )
    `);

  for (const user of claimed.recordset || []) {
    try {
      const emailResult = await sendInactivityReminderEmail(
        user.email,
        user.full_name,
        INACTIVITY_REMINDER_DAYS
      );

      if (!emailResult.success) {
        console.warn(`Reverting reminder claim for ${user.email} because email failed`);
        await pool.request()
          .input('user_id', sql.UniqueIdentifier, user.id)
          .query(`
            UPDATE users
            SET last_inactive_reminder_at = NULL
            WHERE id = @user_id
          `);
      }
    } catch (error) {
      console.error(`Inactivity reminder failed for ${user.email}:`, error.message);
      try {
        await pool.request()
          .input('user_id', sql.UniqueIdentifier, user.id)
          .query(`
            UPDATE users
            SET last_inactive_reminder_at = NULL
            WHERE id = @user_id
          `);
      } catch (revertError) {
        console.error(`Failed to revert reminder claim for ${user.email}:`, revertError.message);
      }
    }
  }
};

export const startInactivityReminderJob = async () => {
  await ensureActivityTrackingColumns();

  if (inactivityReminderJob) {
    return inactivityReminderJob;
  }

  const intervalMs = INACTIVITY_SCAN_INTERVAL_MINUTES > 0
    ? INACTIVITY_SCAN_INTERVAL_MINUTES * 60 * 1000
    : INACTIVITY_SCAN_INTERVAL_HOURS * 60 * 60 * 1000;

  inactivityReminderJob = setInterval(() => {
    runInactivityReminderScan().catch((error) => {
      console.error('Inactivity reminder scan error:', error.message);
    });
  }, intervalMs);

  if (typeof inactivityReminderJob.unref === 'function') {
    inactivityReminderJob.unref();
  }

  runInactivityReminderScan().catch((error) => {
    console.error('Initial inactivity reminder scan error:', error.message);
  });

  return inactivityReminderJob;
};

export default {
  ensureActivityTrackingColumns,
  updateUserLastActive,
  runInactivityReminderScan,
  startInactivityReminderJob,
};
