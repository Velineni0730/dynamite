import User from '../models/User.js';

export const emitToUser = (userId, event, data) => {
  const io = global._io;
  if (io) io.to(`user:${userId}`).emit(event, data);
};

export const emitToStudyRoom = (roomId, event, data) => {
  const io = global._io;
  if (io) io.to(`study-room:${roomId}`).emit(event, data);
};

export const emitPresenceToFriends = async (userId, presence) => {
  const io = global._io;
  if (!io) return;
  const owner = await User.findById(userId).select('friends').lean();
  for (const friendId of (owner?.friends || [])) {
    io.to(`user:${friendId.toString()}`).emit('presence:changed', {
      userId: userId.toString(),
      ...presence,
    });
  }
};
