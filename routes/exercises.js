import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getPool, sql } from '../config/database.js';
import { sendOverdueExerciseEmail } from '../utils/emailService.js';

const router = express.Router();

/**
 * @route   POST /api/exercises/send-overdue-email
 * @desc    Gửi email nhắc trễ bài tập thật đến email của user
 * @access  Private
 */
router.post('/send-overdue-email', verifyToken, async (req, res) => {
  try {
    const { exerciseTitle, courseName, overdueLabel, deadline } = req.body;

    if (!exerciseTitle) {
      return res.status(400).json({ error: 'exerciseTitle is required' });
    }

    // verifyToken only sets req.user.userId & role — query DB for email & name.
    const pool = await getPool();
    const userResult = await pool.request()
      .input('user_id', sql.UniqueIdentifier, req.user.userId)
      .query('SELECT email, full_name FROM users WHERE id = @user_id');

    const dbUser = userResult.recordset[0];

    if (!dbUser || !dbUser.email) {
      return res.status(400).json({ error: 'User does not have an email address' });
    }

    const result = await sendOverdueExerciseEmail(
      dbUser.email,
      dbUser.full_name || '',
      exerciseTitle,
      courseName || '',
      overdueLabel || 'Trễ hạn',
      deadline || null
    );

    if (!result.success) {
      return res.status(500).json({ error: result.message });
    }

    return res.json({
      success: true,
      message: `Email nhắc trễ bài đã gửi đến ${dbUser.email}`,
      to: dbUser.email,
    });
  } catch (error) {
    console.error('Error in send-overdue-email:', error.message);
    return res.status(500).json({
      error: 'Failed to send overdue email',
      message: error.message,
    });
  }
});

export default router;
