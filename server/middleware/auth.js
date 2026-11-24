import User from '../models/User.js';
import { getFirebaseAuth } from '../config/firebaseAdmin.js';

export async function verifyFirebaseToken(req, res, next) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ success: false, error: 'Sign in to continue.' });

  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) return res.status(503).json({ success: false, error: 'Firebase Admin is not configured on the API server.' });

  try {
    req.firebaseUser = await firebaseAuth.verifyIdToken(match[1], true);
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Your sign-in session has expired. Please sign in again.' });
  }
}

export async function protect(req, res, next) {
  return verifyFirebaseToken(req, res, async () => {
    try {
      const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
      if (!user) return res.status(404).json({ success: false, error: 'Dynamite profile not found. Please finish registration.' });
      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  });
}
