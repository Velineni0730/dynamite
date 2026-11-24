import express from 'express';
import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import { emitToUser } from '../socket/helpers.js';

const router = express.Router();
router.use(protect);

const pick = (u) => ({
  _id: u._id,
  publicUid: u.publicUid,
  displayName: u.displayName,
  avatarId: u.avatarId,
  avatarGender: u.avatarGender,
  level: u.level,
  presence: u.presence,
});

router.get('/', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('friends', 'publicUid displayName avatarId avatarGender level presence');
    res.json({ success: true, friends: (user?.friends || []).map(pick) });
  } catch (error) { next(error); }
});

router.get('/requests', async (req, res, next) => {
  try {
    const requests = await FriendRequest.find({ to: req.user._id, status: 'pending' })
      .populate('from', 'publicUid displayName avatarId avatarGender level presence')
      .sort({ createdAt: -1 });
    const outgoing = await FriendRequest.find({ from: req.user._id, status: 'pending' })
      .populate('to', 'publicUid displayName avatarId avatarGender level presence')
      .sort({ createdAt: -1 });
    res.json({ success: true, incoming: requests.map((r) => ({ _id: r._id, from: pick(r.from), createdAt: r.createdAt })), outgoing: outgoing.map((r) => ({ _id: r._id, to: pick(r.to), createdAt: r.createdAt })) });
  } catch (error) { next(error); }
});

router.post('/requests', async (req, res, next) => {
  try {
    const publicUid = String(req.body.publicUid || '').trim().toUpperCase();
    if (!publicUid) return res.status(400).json({ success: false, error: 'Enter your friend’s Dynamite UID.' });
    const recipient = await User.findOne({ publicUid });
    if (!recipient) return res.status(404).json({ success: false, error: 'No Dynamite account matches that UID.' });
    if (recipient._id.equals(req.user._id)) return res.status(400).json({ success: false, error: 'You cannot add yourself.' });
    if (req.user.friends.some((id) => id.equals(recipient._id))) return res.status(409).json({ success: false, error: 'You are already friends.' });

    const reverse = await FriendRequest.findOne({ from: recipient._id, to: req.user._id, status: 'pending' });
    if (reverse) return res.status(409).json({ success: false, error: 'This person has already sent you a request. Accept it in Incoming requests.' });
    let request = await FriendRequest.findOne({ from: req.user._id, to: recipient._id });
    if (request?.status === 'pending') return res.status(409).json({ success: false, error: 'Friend request already sent.' });
    if (request) {
      request.status = 'pending';
      request.message = undefined;
      await request.save();
    } else {
      request = await FriendRequest.create({ from: req.user._id, to: recipient._id, status: 'pending' });
    }
    const notification = await Notification.create({
      recipient: recipient._id,
      type: 'friend_request',
      title: 'A new friend request',
      message: `${req.user.displayName} wants to add you as a friend.`,
      data: { requestId: request._id.toString(), fromUid: req.user.publicUid },
    });
    emitToUser(recipient._id, 'notification:new', notification);
    res.status(201).json({ success: true, message: 'Friend request sent.', requestId: request._id });
  } catch (error) { next(error); }
});

router.post('/requests/:id/accept', async (req, res, next) => {
  try {
    const request = await FriendRequest.findOne({ _id: req.params.id, to: req.user._id, status: 'pending' });
    if (!request) return res.status(404).json({ success: false, error: 'This request is no longer available.' });
    await FriendRequest.updateOne({ _id: request._id, status: 'pending' }, { $set: { status: 'accepted' } });
    await Promise.all([
      User.updateOne({ _id: request.from }, { $addToSet: { friends: request.to } }),
      User.updateOne({ _id: request.to }, { $addToSet: { friends: request.from } }),
    ]);
    const notification = await Notification.create({ recipient: request.from, type: 'friend_accepted', title: 'Friend request accepted', message: `${req.user.displayName} is now your friend.`, data: { friendUid: req.user.publicUid } });
    emitToUser(request.from, 'notification:new', notification);
    res.json({ success: true, message: 'You are friends now.' });
  } catch (error) { next(error); }
});

router.delete('/requests/:id', async (req, res, next) => {
  try {
    const deleted = await FriendRequest.findOneAndDelete({ _id: req.params.id, to: req.user._id, status: 'pending' });
    if (!deleted) return res.status(404).json({ success: false, error: 'Request not found.' });
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.delete('/:friendId', async (req, res, next) => {
  try {
    const friendId = req.params.friendId;
    await Promise.all([
      User.updateOne({ _id: req.user._id }, { $pull: { friends: friendId } }),
      User.updateOne({ _id: friendId }, { $pull: { friends: req.user._id } }),
    ]);
    res.json({ success: true });
  } catch (error) { next(error); }
});

export default router;
