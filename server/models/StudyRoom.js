import mongoose from 'mongoose';
import crypto from 'node:crypto';

const participantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['host', 'guest'], default: 'guest' },
  activityState: { type: String, enum: ['idle', 'focus', 'break'], default: 'idle' },
  joinedAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: Date.now },
}, { _id: false });

const studyRoomSchema = new mongoose.Schema({
  title: { type: String, trim: true, maxlength: 80, default: 'A little study date' },
  subject: { type: String, trim: true, maxlength: 100, required: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invitedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: { type: [participantSchema], default: [] },
  status: { type: String, enum: ['invited', 'waiting', 'active', 'completed', 'cancelled'], default: 'invited', index: true },
  phase: { type: String, enum: ['waiting', 'focus', 'break', 'completed'], default: 'waiting' },
  focusMinutes: { type: Number, default: 25 },
  breakMinutes: { type: Number, default: 5 },
  startedAt: Date,
  targetEndAt: Date,
  completedAt: Date,
  inviteCode: { type: String, unique: true, default: () => crypto.randomBytes(4).toString('hex').toUpperCase() },
}, { timestamps: true });

studyRoomSchema.index({ host: 1, status: 1 });
studyRoomSchema.index({ invitedUser: 1, status: 1 });
studyRoomSchema.index({ 'participants.user': 1, status: 1 });

export default mongoose.model('StudyRoom', studyRoomSchema);
