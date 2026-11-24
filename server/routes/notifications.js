import express from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(30);
    res.json({ success: true, notifications, unreadCount: notifications.filter((n) => !n.read).length });
  } catch (error) { next(error); }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { $set: { read: true, readAt: new Date() } },
      { new: true },
    );
    if (!notification) return res.status(404).json({ success: false, error: 'Notification not found.' });
    res.json({ success: true, notification });
  } catch (error) { next(error); }
});

router.patch('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { $set: { read: true, readAt: new Date() } });
    res.json({ success: true });
  } catch (error) { next(error); }
});

export default router;
