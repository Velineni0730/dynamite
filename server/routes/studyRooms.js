import express from 'express';
import mongoose from 'mongoose';
import StudyRoom from '../models/StudyRoom.js';
import User from '../models/User.js';
import FocusSession from '../models/FocusSession.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import { emitToStudyRoom, emitToUser, emitPresenceToFriends } from '../socket/helpers.js';

const router = express.Router();
router.use(protect);

const populateRoom = (query) => query
  .populate('host', 'publicUid displayName avatarId avatarGender presence level')
  .populate('invitedUser', 'publicUid displayName avatarId avatarGender presence level')
  .populate('participants.user', 'publicUid displayName avatarId avatarGender presence level');

router.get('/invitations', async (req, res, next) => {
  try {
    const rooms = await populateRoom(StudyRoom.find({ invitedUser: req.user._id, status: 'invited' })).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, rooms });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const { friendId, subject, title } = req.body || {};
    if (!mongoose.isValidObjectId(friendId)) return res.status(400).json({ success: false, error: 'Choose a friend to invite.' });
    if (!subject?.trim()) return res.status(400).json({ success: false, error: 'Add the subject you plan to study.' });
    if (!req.user.friends.some((id) => id.equals(friendId))) return res.status(403).json({ success: false, error: 'You can invite friends from your friends list only.' });
    if (req.user.activeRoom) {
      const activeRoom = await StudyRoom.findById(req.user.activeRoom).select('status');
      if (activeRoom && ['invited', 'waiting', 'active'].includes(activeRoom.status)) {
        return res.status(409).json({ success: false, error: 'Finish or leave your current study room before inviting someone else.' });
      }
      await User.updateOne({ _id: req.user._id }, { $set: { activeRoom: null } });
    }
    const friend = await User.findById(friendId);
    if (!friend) return res.status(404).json({ success: false, error: 'Friend account not found.' });

    const room = await StudyRoom.create({
      title: title?.trim() || 'A little study date',
      subject: subject.trim().slice(0, 100),
      host: req.user._id,
      invitedUser: friend._id,
      status: 'invited',
      phase: 'waiting',
      participants: [{ user: req.user._id, role: 'host', activityState: 'idle' }],
    });
    await User.updateOne({ _id: req.user._id }, { $set: { activeRoom: room._id } });
    const notification = await Notification.create({
      recipient: friend._id,
      type: 'study_invite',
      title: 'You have a study invitation',
      message: `${req.user.displayName} invited you to study ${room.subject}.`,
      data: { roomId: room._id.toString(), fromUid: req.user.publicUid, subject: room.subject },
    });
    emitToUser(friend._id, 'notification:new', notification);
    res.status(201).json({ success: true, room: await populateRoom(StudyRoom.findById(room._id)) });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const room = await populateRoom(StudyRoom.findById(req.params.id));
    if (!room) return res.status(404).json({ success: false, error: 'Study room not found.' });
    const allowed = room.host._id.equals(req.user._id) || room.invitedUser._id.equals(req.user._id) || room.participants.some((p) => p.user._id.equals(req.user._id));
    if (!allowed) return res.status(403).json({ success: false, error: 'This room is private.' });
    res.json({ success: true, room });
  } catch (error) { next(error); }
});

router.post('/:id/accept', async (req, res, next) => {
  try {
    const invitee = await User.findById(req.user._id).select('activeRoom');
    if (invitee?.activeRoom && !invitee.activeRoom.equals(req.params.id)) {
      const otherRoom = await StudyRoom.findById(invitee.activeRoom).select('status');
      if (otherRoom && ['invited', 'waiting', 'active'].includes(otherRoom.status)) {
        return res.status(409).json({ success: false, error: 'Leave your current study room before joining another one.' });
      }
      await User.updateOne({ _id: req.user._id }, { $set: { activeRoom: null } });
    }

    // The update is conditional, so a repeated click or React StrictMode request
    // cannot add the same participant twice.
    const changed = await StudyRoom.updateOne(
      { _id: req.params.id, invitedUser: req.user._id, status: 'invited', 'participants.user': { $ne: req.user._id } },
      {
        $set: { status: 'waiting' },
        $push: { participants: { user: req.user._id, role: 'guest', activityState: 'idle' } },
      },
    );
    let room = await StudyRoom.findOne({
      _id: req.params.id,
      invitedUser: req.user._id,
      status: 'waiting',
      'participants.user': req.user._id,
    });
    if (!room) return res.status(404).json({ success: false, error: 'This invitation is no longer available.' });
    await User.updateOne({ _id: req.user._id }, { $set: { activeRoom: room._id } });
    await User.updateOne({ _id: room.host }, { $set: { activeRoom: room._id } });
    if (changed.modifiedCount > 0) {
      emitToStudyRoom(room._id, 'study-room:updated', { roomId: room._id.toString(), reason: 'accepted' });
      emitToUser(room.host, 'study-room:invitation-accepted', { roomId: room._id.toString() });
    }
    room = await populateRoom(StudyRoom.findById(room._id));
    res.json({ success: true, room });
  } catch (error) { next(error); }
});

router.post('/:id/decline', async (req, res, next) => {
  try {
    const room = await StudyRoom.findOneAndUpdate(
      { _id: req.params.id, invitedUser: req.user._id, status: 'invited' },
      { $set: { status: 'cancelled', phase: 'completed', completedAt: new Date() } },
      { new: true },
    );
    if (!room) return res.status(404).json({ success: false, error: 'This invitation is no longer available.' });
    await User.updateOne({ _id: room.host, activeRoom: room._id }, { $set: { activeRoom: null } });
    const notification = await Notification.create({
      recipient: room.host,
      type: 'study_declined',
      title: 'Study invitation declined',
      message: `${req.user.displayName} could not join this study session.`,
      data: { roomId: room._id.toString() },
    });
    emitToUser(room.host, 'notification:new', notification);
    emitToStudyRoom(room._id, 'study-room:updated', { roomId: room._id.toString(), reason: 'declined' });
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.post('/:id/start', async (req, res, next) => {
  try {
    const room = await StudyRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, error: 'Room not found.' });
    if (!room.host.equals(req.user._id)) return res.status(403).json({ success: false, error: 'Only the host can start this shared timer.' });
    if (room.participants.length !== 2) return res.status(409).json({ success: false, error: 'Your friend needs to join before the session can start.' });
    if (!['waiting', 'invited'].includes(room.status)) return res.status(409).json({ success: false, error: 'This study session has already started or ended.' });
    const now = new Date();
    room.status = 'active';
    room.phase = 'focus';
    room.startedAt = now;
    room.targetEndAt = new Date(now.getTime() + room.focusMinutes * 60 * 1000);
    room.participants.forEach((p) => { p.activityState = 'focus'; });
    await room.save();
    await User.updateMany({ _id: { $in: room.participants.map((p) => p.user) } }, { $set: { 'presence.activityState': 'focus', activeRoom: room._id } });
    await Promise.all(room.participants.map((participant) => emitPresenceToFriends(participant.user, { activityState: 'focus' })));
    emitToStudyRoom(room._id, 'study-room:updated', { roomId: room._id.toString(), reason: 'started' });
    res.json({ success: true, room: await populateRoom(StudyRoom.findById(room._id)) });
  } catch (error) { next(error); }
});

router.post('/:id/phase', async (req, res, next) => {
  try {
    const room = await StudyRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, error: 'Room not found.' });
    if (!room.participants.some((participant) => participant.user.equals(req.user._id))) {
      return res.status(403).json({ success: false, error: 'Only a participant can synchronize this shared timer.' });
    }
    const now = new Date();
    if (room.status !== 'active' || !room.targetEndAt || room.targetEndAt.getTime() > now.getTime()) {
      // Another participant may have advanced the phase a moment earlier.
      // Return the authoritative room state rather than surfacing a false timer error.
      const latest = await populateRoom(StudyRoom.findById(room._id));
      return res.json({ success: true, room: latest });
    }

    if (room.phase === 'focus') {
      const updated = await StudyRoom.findOneAndUpdate(
        { _id: room._id, status: 'active', phase: 'focus', targetEndAt: { $lte: now } },
        { $set: { phase: 'break', targetEndAt: new Date(room.targetEndAt.getTime() + room.breakMinutes * 60 * 1000), 'participants.$[].activityState': 'break' } },
        { new: true },
      );
      if (updated) {
        await User.updateMany({ _id: { $in: updated.participants.map((p) => p.user) } }, { $set: { 'presence.activityState': 'break' } });
        await Promise.all(updated.participants.map((participant) => emitPresenceToFriends(participant.user, { activityState: 'break' })));
        emitToStudyRoom(updated._id, 'study-room:updated', { roomId: updated._id.toString(), reason: 'break-started' });
      }
    } else if (room.phase === 'break') {
      const completed = await StudyRoom.findOneAndUpdate(
        { _id: room._id, status: 'active', phase: 'break', targetEndAt: { $lte: now } },
        { $set: { phase: 'completed', status: 'completed', completedAt: now, 'participants.$[].activityState': 'idle' } },
        { new: true },
      );
      if (completed) {
        await User.updateMany({ _id: { $in: completed.participants.map((p) => p.user) } }, { $set: { 'presence.activityState': 'idle', activeRoom: null } });
        await Promise.all(completed.participants.map((participant) => emitPresenceToFriends(participant.user, { activityState: 'idle' })));
        for (const participant of completed.participants) {
          const session = await FocusSession.updateOne(
            { user: participant.user, room: completed._id },
            { $setOnInsert: { user: participant.user, room: completed._id, subject: completed.subject, plannedDuration: completed.focusMinutes, actualDuration: completed.focusMinutes, startedAt: completed.startedAt, completedAt: completed.completedAt, xpEarned: completed.focusMinutes * 2, status: 'completed' } },
            { upsert: true },
          );
          if (session.upsertedCount > 0) {
            const person = await User.findById(participant.user);
            if (person) {
              person.totalFocusMinutes += completed.focusMinutes;
              person.completedSessions += 1;
              person.xp += completed.focusMinutes * 2;
              person.level = Math.floor(Math.sqrt(person.xp / 100)) + 1;
              person.activeRoom = null;
              await person.save();
            }
          }
        }
        emitToStudyRoom(completed._id, 'study-room:updated', { roomId: completed._id.toString(), reason: 'completed' });
      }
    }
    const latest = await populateRoom(StudyRoom.findById(req.params.id));
    res.json({ success: true, room: latest });
  } catch (error) { next(error); }
});

router.post('/:id/activity', async (req, res, next) => {
  try {
    const { activityState } = req.body || {};
    if (!['focus', 'break'].includes(activityState)) return res.status(400).json({ success: false, error: 'Choose focus or break.' });
    const room = await StudyRoom.findOne({ _id: req.params.id, status: 'active' });
    if (!room) return res.status(404).json({ success: false, error: 'There is no active study session.' });
    const participant = room.participants.find((p) => p.user.equals(req.user._id));
    if (!participant) return res.status(403).json({ success: false, error: 'You are not a participant in this room.' });
    participant.activityState = room.phase === 'break' ? 'break' : activityState;
    await room.save();
    await User.updateOne({ _id: req.user._id }, { $set: { 'presence.activityState': participant.activityState } });
    await emitPresenceToFriends(req.user._id, { activityState: participant.activityState });
    emitToStudyRoom(room._id, 'study-room:updated', { roomId: room._id.toString(), reason: 'activity-changed' });
    res.json({ success: true, room: await populateRoom(StudyRoom.findById(room._id)) });
  } catch (error) { next(error); }
});

router.post('/:id/leave', async (req, res, next) => {
  try {
    const room = await StudyRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, error: 'Study room not found.' });
    const member = room.participants.some((p) => p.user.equals(req.user._id));
    if (!member) return res.status(404).json({ success: false, error: 'You are not in this room.' });
    if (['completed', 'cancelled'].includes(room.status)) {
      await User.updateOne({ _id: req.user._id, activeRoom: room._id }, { $set: { activeRoom: null } });
      return res.json({ success: true });
    }

    // Keep the first release deliberately simple: either participant leaving
    // cancels the shared cycle and releases both users from the room.
    room.status = 'cancelled';
    room.phase = 'completed';
    room.completedAt = new Date();
    room.participants.forEach((participant) => { participant.activityState = 'idle'; });
    await room.save();
    await User.updateMany(
      { _id: { $in: room.participants.map((participant) => participant.user) }, activeRoom: room._id },
      { $set: { activeRoom: null, 'presence.activityState': 'idle' } },
    );
    await Promise.all(room.participants.map((participant) => emitPresenceToFriends(participant.user, { activityState: 'idle' })));
    const otherParticipant = room.participants.find((participant) => !participant.user.equals(req.user._id));
    const otherUserId = otherParticipant?.user || room.invitedUser;
    if (otherUserId && !otherUserId.equals(req.user._id)) {
      const notification = await Notification.create({
        recipient: otherUserId,
        type: 'system',
        title: 'Study room closed',
        message: `${req.user.displayName} left the shared study room.`,
        data: { roomId: room._id.toString() },
      });
      emitToUser(otherUserId, 'notification:new', notification);
    }
    emitToStudyRoom(room._id, 'study-room:updated', { roomId: room._id.toString(), reason: 'left' });
    res.json({ success: true });
  } catch (error) { next(error); }
});

export default router;
