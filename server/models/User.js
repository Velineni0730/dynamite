import mongoose from 'mongoose';
import crypto from 'node:crypto';

function makePublicUid() {
  return `DYN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true, index: true },
  publicUid: { type: String, required: true, unique: true, default: makePublicUid, index: true},
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  displayName: { type: String, required: true, trim: true, maxlength: 30 },
  avatarId: { type: String, enum: ['boy-01', 'boy-02', 'boy-03', 'girl-01', 'girl-02', 'girl-03'], default: 'boy-01' },
  avatarGender: { type: String, enum: ['boy', 'girl'], default: 'boy' },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  presence: {
    status: { type: String, enum: ['online', 'offline'], default: 'offline' },
    activityState: { type: String, enum: ['idle', 'focus', 'break'], default: 'idle' },
    lastSeenAt: { type: Date, default: Date.now },
  },
  xp: { type: Number, default: 0, min: 0 },
  level: { type: Number, default: 1, min: 1 },
  totalFocusMinutes: { type: Number, default: 0, min: 0 },
  completedSessions: { type: Number, default: 0, min: 0 },
  onboardingCompleted: { type: Boolean, default: true },
  timezone: { type: String, default: 'Asia/Kolkata' },
  activeRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyRoom', default: null },
}, { timestamps: true, toJSON: { virtuals: true } });

userSchema.index({ friends: 1 });

export default mongoose.model('User', userSchema);
