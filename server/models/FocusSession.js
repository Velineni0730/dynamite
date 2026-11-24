import mongoose from 'mongoose';

const focusSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyRoom' },
  subject: { type: String, required: true, trim: true, maxlength: 100 },
  plannedDuration: { type: Number, required: true },
  actualDuration: { type: Number, required: true },
  status: { type: String, enum: ['completed', 'cancelled'], default: 'completed' },
  startedAt: Date,
  completedAt: { type: Date, default: Date.now },
  xpEarned: { type: Number, default: 0 },
}, { timestamps: true });

focusSessionSchema.index({ user: 1, completedAt: -1 });
focusSessionSchema.index({ user: 1, room: 1 }, { unique: true, partialFilterExpression: { room: { $exists: true } } });
export default mongoose.model('FocusSession', focusSessionSchema);
