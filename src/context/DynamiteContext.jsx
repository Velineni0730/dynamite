import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { io } from 'socket.io-client';
import { firebaseAuth, firebaseConfigured } from '../lib/firebase';
import { api, jsonRequest, SOCKET_URL } from '../lib/api';

const Context = createContext(null);

export function DynamiteProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState({ incoming: [], outgoing: [] });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  const syncProfile = useCallback(async (details = {}) => {
    await api('/users/sync', jsonRequest('POST', details));
    const result = await api('/users/me');
    setUser(result.user);
    return result.user;
  }, []);

  useEffect(() => {
    if (!firebaseAuth) {
      setLoading(false);
      setAuthError('Firebase is not configured yet. Add the VITE_FIREBASE_* values to your frontend .env file.');
      return undefined;
    }
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (nextAuthUser) => {
      setAuthUser(nextAuthUser);
      if (!nextAuthUser) {
        setUser(null);
        setFriends([]);
        setFriendRequests({ incoming: [], outgoing: [] });
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        await syncProfile({ displayName: nextAuthUser.displayName || undefined });
        setAuthError('');
      } catch (error) {
        setAuthError(error.message);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [syncProfile]);

  useEffect(() => {
    if (!authUser || !user || !firebaseAuth) return undefined;
    let active = true;
    let nextSocket;
    authUser.getIdToken().then((token) => {
      if (!active) return;
      nextSocket = io(SOCKET_URL, { transports: ['websocket', 'polling'], auth: { token }, reconnection: true, reconnectionAttempts: 12 });
      nextSocket.on('notification:new', (notification) => {
        setNotifications((current) => [notification, ...current.filter((item) => item._id !== notification._id)].slice(0, 30));
        setUnreadCount((count) => count + 1);
      });
      nextSocket.on('presence:changed', ({ userId, status, activityState }) => {
        setFriends((current) => current.map((friend) => friend._id === userId ? {
          ...friend,
          presence: { ...friend.presence, ...(status ? { status } : {}), ...(activityState ? { activityState } : {}) },
        } : friend));
      });
      setSocket(nextSocket);
    }).catch(() => {});
    return () => {
      active = false;
      nextSocket?.disconnect();
      setSocket(null);
    };
  }, [authUser, user?._id]);

  const register = useCallback(async ({ displayName, email, password, avatarId }) => {
    if (!firebaseConfigured || !firebaseAuth) throw new Error('Firebase is not configured. Add your Firebase web app credentials first.');
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
    await updateProfile(credential.user, { displayName: displayName.trim() });
    const profile = await syncProfile({ displayName: displayName.trim(), avatarId, avatarGender: avatarId.startsWith('girl') ? 'girl' : 'boy', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
    return profile;
  }, [syncProfile]);

  const login = useCallback(async ({ email, password }) => {
    if (!firebaseConfigured || !firebaseAuth) throw new Error('Firebase is not configured. Add your Firebase web app credentials first.');
    const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
    return syncProfile({ displayName: credential.user.displayName || undefined });
  }, [syncProfile]);

  const logout = useCallback(async () => {
    if (socket) socket.disconnect();
    await signOut(firebaseAuth);
    setUser(null);
  }, [socket]);

  const updateAvatar = useCallback(async (avatarId) => {
    const result = await api('/users/me', jsonRequest('PATCH', { avatarId }));
    setUser(result.user);
    return result.user;
  }, []);

  const refreshProfile = useCallback(async () => {
    const result = await api('/users/me');
    setUser(result.user);
    return result.user;
  }, []);

  const refreshFriends = useCallback(async () => {
    const [friendsResult, requestResult] = await Promise.all([api('/friends'), api('/friends/requests')]);
    setFriends(friendsResult.friends || []);
    setFriendRequests({ incoming: requestResult.incoming || [], outgoing: requestResult.outgoing || [] });
  }, []);

  const refreshNotifications = useCallback(async () => {
    const result = await api('/notifications');
    setNotifications(result.notifications || []);
    setUnreadCount(result.unreadCount || 0);
  }, []);

  const markNotificationRead = useCallback(async (id) => {
    await api(`/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications((current) => current.map((item) => item._id === id ? { ...item, read: true } : item));
    setUnreadCount((count) => Math.max(0, count - 1));
  }, []);

  useEffect(() => {
    if (!user) return;
    refreshFriends().catch(() => {});
    refreshNotifications().catch(() => {});
  }, [user?._id, refreshFriends, refreshNotifications]);

  const value = useMemo(() => ({
    user, authUser, loading, authError, firebaseConfigured, register, login, logout,
    updateAvatar, refreshProfile, refreshFriends, refreshNotifications, friends, friendRequests,
    notifications, unreadCount, markNotificationRead, socket, setUser,
  }), [user, authUser, loading, authError, register, login, logout, updateAvatar, refreshProfile, refreshFriends, refreshNotifications, friends, friendRequests, notifications, unreadCount, markNotificationRead, socket]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useDynamite() {
  const value = useContext(Context);
  if (!value) throw new Error('useDynamite must be used inside DynamiteProvider');
  return value;
}
