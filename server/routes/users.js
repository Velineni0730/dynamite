import express from 'express';
import User from '../models/User.js';
import { verifyFirebaseToken, protect } from '../middleware/auth.js';

const router = express.Router();

const publicUser = (user) => ({
  _id: user._id,
  publicUid: user.publicUid,
  email: user.email,
  displayName: user.displayName,
  avatarId: user.avatarId,
  avatarGender: user.avatarGender,
  xp: user.xp,
  level: user.level,
  totalFocusMinutes: user.totalFocusMinutes,
  completedSessions: user.completedSessions,
  presence: user.presence,
  onboardingCompleted: user.onboardingCompleted,
  activeRoom: user.activeRoom || null,
});

router.post('/sync', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { displayName, avatarId, avatarGender, timezone } = req.body || {};
    const firebaseUid = req.firebaseUser.uid;
    const validAvatars = ['boy-01', 'boy-02', 'boy-03', 'girl-01', 'girl-02', 'girl-03'];
    const safeAvatar = validAvatars.includes(avatarId) ? avatarId : 'boy-01';
    const gender = safeAvatar.startsWith('girl') ? 'girl' : (avatarGender === 'girl' ? 'girl' : 'boy');
    let user = await User.findOne({ firebaseUid });
    if (!user) {
      try {
        user = await User.create({
          firebaseUid,
          email: (req.firebaseUser.email || '').toLowerCase(),
          displayName: (displayName || req.firebaseUser.name || 'Study Hero').trim().slice(0, 30),
          avatarId: safeAvatar,
          avatarGender: gender,
          timezone: timezone || 'Asia/Kolkata',
          onboardingCompleted: true,
        });
      } catch (error) {
        if (error.code !== 11000) throw error;
        user = await User.findOne({ firebaseUid });
      }
    }
    if (!user) return res.status(500).json({ success: false, error: 'Unable to create your Dynamite profile.' });
    if (req.firebaseUser.email) user.email = req.firebaseUser.email.toLowerCase();
    if (displayName?.trim()) user.displayName = displayName.trim().slice(0, 30);
    if (avatarId && validAvatars.includes(avatarId)) {
      user.avatarId = safeAvatar;
      user.avatarGender = gender;
    }
    if (timezone) user.timezone = String(timezone).slice(0, 60);
    await user.save();
    res.status(200).json({ success: true, user: publicUser(user) });
  } catch (error) { next(error); }
});

router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: publicUser(req.user) });
});

router.patch('/me', protect, async (req, res, next) => {
  try {
    const { displayName, avatarId, timezone } = req.body || {};
    if (displayName !== undefined) {
      const clean = String(displayName).trim();
      if (clean.length < 2 || clean.length > 30) return res.status(400).json({ success: false, error: 'Name must be 2–30 characters.' });
      req.user.displayName = clean;
    }
    if (avatarId !== undefined) {
      const valid = ['boy-01', 'boy-02', 'boy-03', 'girl-01', 'girl-02', 'girl-03'];
      if (!valid.includes(avatarId)) return res.status(400).json({ success: false, error: 'Choose one of the available Hero designs.' });
      req.user.avatarId = avatarId;
      req.user.avatarGender = avatarId.startsWith('girl') ? 'girl' : 'boy';
    }
    if (timezone) req.user.timezone = String(timezone).slice(0, 60);
    await req.user.save();
    res.json({ success: true, user: publicUser(req.user) });
  } catch (error) { next(error); }
});

export default router;
