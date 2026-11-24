import express from 'express';
import FocusSession from '../models/FocusSession.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.get('/', protect, async (req, res, next) => {
  try {
    const sessions = await FocusSession.find({ user: req.user._id }).sort({ completedAt: -1 }).limit(30).select('subject plannedDuration actualDuration completedAt xpEarned room');
    res.json({ success: true, sessions });
  } catch (error) { next(error); }
});
export default router;
