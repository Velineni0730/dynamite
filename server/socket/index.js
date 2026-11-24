import User from '../models/User.js';
import StudyRoom from '../models/StudyRoom.js';
import { getFirebaseAuth } from '../config/firebaseAdmin.js';

const connectedUsers = new Map();

export function initializeSocket(io) {
  global._io = io;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const firebaseAuth = getFirebaseAuth();
      if (!token || !firebaseAuth) return next(new Error('Authentication required'));
      const decoded = await firebaseAuth.verifyIdToken(token, true);
      const user = await User.findOne({ firebaseUid: decoded.uid });
      if (!user) return next(new Error('Dynamite profile not found'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    const current = connectedUsers.get(userId) || new Set();
    current.add(socket.id);
    connectedUsers.set(userId, current);
    socket.join(`user:${userId}`);

    await User.updateOne({ _id: userId }, { $set: { 'presence.status': 'online', 'presence.lastSeenAt': new Date() } });
    const me = await User.findById(userId).select('friends presence').lean();
    for (const friendId of (me?.friends || [])) {
      io.to(`user:${friendId.toString()}`).emit('presence:changed', { userId, status: 'online', activityState: me?.presence?.activityState || 'idle' });
    }
    socket.emit('connection:ready', { userId });

    socket.on('study-room:join', async (roomId, callback) => {
      try {
        const room = await StudyRoom.findById(roomId).select('participants invitedUser host status').lean();
        if (!room) return callback?.({ ok: false, error: 'Room not found.' });
        const member = room.host.toString() === userId
          || room.invitedUser.toString() === userId
          || room.participants.some((p) => p.user.toString() === userId);
        if (!member) return callback?.({ ok: false, error: 'You are not invited to this room.' });
        socket.join(`study-room:${roomId}`);
        callback?.({ ok: true });
      } catch {
        callback?.({ ok: false, error: 'Unable to join this room.' });
      }
    });

    socket.on('study-room:leave', (roomId) => socket.leave(`study-room:${roomId}`));

    socket.on('disconnect', async () => {
      const sockets = connectedUsers.get(userId);
      sockets?.delete(socket.id);
      if (!sockets || sockets.size === 0) {
        connectedUsers.delete(userId);
        await User.updateOne({ _id: userId }, { $set: { 'presence.status': 'offline', 'presence.lastSeenAt': new Date() } });
        const friends = await User.findById(userId).select('friends presence').lean();
        for (const friendId of (friends?.friends || [])) {
          io.to(`user:${friendId.toString()}`).emit('presence:changed', { userId, status: 'offline', activityState: friends?.presence?.activityState || 'idle' });
        }
      }
    });
  });
}
