import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['friend_request', 'friend_accepted', 'study_invite', 'study_declined', 'system'], required: true },
  title: { type: String, required: true, maxlength: 100 },
  message: { type: String, required: true, maxlength: 300 },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  read: { type: Boolean, default: false },
  readAt: Date,
}, { timestamps: true });

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
export default mongoose.model('Notification', notificationSchema);
