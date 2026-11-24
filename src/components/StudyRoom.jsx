import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, jsonRequest } from '../lib/api';
import { useDynamite } from '../context/DynamiteContext';
import RoomScene from './room/RoomScene';
import roomBackground from '../assets/rooms/shared-study-room.png';

function formatTime(seconds) {
  const safe = Math.max(0, seconds);
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

const userIdOf = (participant) => participant?.user?._id || participant?.user;

export default function StudyRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, friends, refreshFriends, socket } = useDynamite();
  const [room, setRoom] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState('');
  const [subject, setSubject] = useState('DBMS — Normalization');
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(Boolean(roomId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const transitionLock = useRef('');

  useEffect(() => { refreshFriends().catch(() => {}); }, [refreshFriends]);

  const loadRoom = useCallback(async () => {
    if (!roomId) return;
    const result = await api(`/study-rooms/${roomId}`);
    setRoom(result.room);
  }, [roomId, user?._id]);

  useEffect(() => {
    if (!roomId) { setLoading(false); return; }
    let alive = true;
    setLoading(true); setError('');
    loadRoom().catch((err) => { if (alive) setError(err.message); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [roomId, loadRoom]);

  useEffect(() => {
    if (!socket || !roomId) return undefined;
    socket.emit('study-room:join', roomId, (result) => { if (!result?.ok) setError(result?.error || 'Unable to join the live room.'); });
    const update = (event) => { if (event?.roomId === roomId) loadRoom().catch((err) => setError(err.message)); };
    socket.on('study-room:updated', update);
    return () => { socket.emit('study-room:leave', roomId); socket.off('study-room:updated', update); };
  }, [socket, roomId, loadRoom]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 300);
    return () => window.clearInterval(interval);
  }, []);

  const isHost = Boolean(room?.host?._id === user._id || room?.host === user._id);
  const ownParticipant = room?.participants?.find((item) => userIdOf(item) === user._id);
  const buddyParticipant = room?.participants?.find((item) => userIdOf(item) !== user._id);
  const remaining = useMemo(() => {
    if (!room?.targetEndAt || !['focus', 'break'].includes(room.phase)) return room?.phase === 'completed' ? 0 : 0;
    return Math.max(0, Math.ceil((new Date(room.targetEndAt).getTime() - now) / 1000));
  }, [room?.targetEndAt, room?.phase, now]);

  useEffect(() => {
    if (!room || room.status !== 'active' || remaining > 0) return;
    const key = `${room._id}:${room.phase}:${room.targetEndAt}`;
    if (transitionLock.current === key) return;
    transitionLock.current = key;
    api(`/study-rooms/${room._id}/phase`, { method: 'POST' })
      .then((result) => setRoom(result.room))
      .catch((err) => { setError(err.message); loadRoom().catch(() => {}); });
  }, [room, isHost, remaining, loadRoom]);

  const createRoom = async (event) => {
    event.preventDefault(); setError('');
    if (!selectedFriend) return setError('Choose a friend first.');
    if (!subject.trim()) return setError('Add a subject for your session.');
    setBusy(true);
    try {
      const result = await api('/study-rooms', jsonRequest('POST', { friendId: selectedFriend, subject: subject.trim(), title: `${user.displayName}'s study room` }));
      navigate(`/study-room/${result.room._id}`);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const start = async () => {
    setBusy(true); setError('');
    try { const result = await api(`/study-rooms/${room._id}/start`, { method: 'POST' }); setRoom(result.room); transitionLock.current = ''; }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const acceptInvitation = async () => {
    setBusy(true); setError('');
    try {
      const result = await api(`/study-rooms/${room._id}/accept`, { method: 'POST' });
      setRoom(result.room);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const declineInvitation = async () => {
    setBusy(true); setError('');
    try {
      await api(`/study-rooms/${room._id}/decline`, { method: 'POST' });
      navigate('/dashboard');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const toggleActivity = async () => {
    if (!room || room.phase !== 'focus') return;
    const next = ownParticipant?.activityState === 'break' ? 'focus' : 'break';
    setBusy(true);
    try { const result = await api(`/study-rooms/${room._id}/activity`, jsonRequest('POST', { activityState: next })); setRoom(result.room); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const leave = async () => {
    if (!room) return navigate('/dashboard');
    setBusy(true);
    try { await api(`/study-rooms/${room._id}/leave`, { method: 'POST' }); navigate('/dashboard'); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  if (!roomId) {
    return (
      <main className="app-page study-room-page">
        <div className="page-heading-row"><div><span className="eyebrow">A SHARED LITTLE SPACE</span><h1>Study Together <span>♡</span></h1><p>Invite one friend. Set a topic. Make a little progress side by side.</p></div><Link to="/friends" className="text-link">Manage friends →</Link></div>
        <section className="study-create-layout">
          <article className="content-card study-create-card"><span className="eyebrow">START A TWO-PERSON SESSION</span><h2>Who is joining you?</h2><p>Choose someone from your friends list. We'll send them a room invitation.</p>
            {friends.length ? <form onSubmit={createRoom}><label className="form-field"><span>Study buddy</span><select value={selectedFriend} onChange={(event) => setSelectedFriend(event.target.value)} required><option value="">Choose a friend…</option>{friends.map((friend) => <option value={friend._id} key={friend._id}>{friend.displayName} · {friend.presence?.status === 'online' ? 'Online' : 'Offline'}</option>)}</select></label><label className="form-field"><span>What are you studying?</span><input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={100} required /></label><div className="session-cycle-note"><span>◷</span><div><strong>25 minutes focus + 5 minutes break</strong><small>One shared 30-minute cycle. Your friend will see your avatar and activity state.</small></div></div><button className="button-primary auth-submit" disabled={busy}>{busy ? 'Creating invitation…' : 'Create room & invite'} <span>♡</span></button></form> : <div className="friends-empty"><span>☁</span><h3>Find your first study buddy.</h3><p>Add a friend using their Dynamite UID before creating a shared room.</p><Link to="/friends" className="button-primary">Go to friends →</Link></div>}
            {error && <p className="inline-error">{error}</p>}
          </article>
          <article className="study-create-preview"><img src={roomBackground} alt="Shared study room"/><div><strong>Two seats, one quiet goal.</strong><p>Both avatars stay visible. Either person can take a short break, and the other will see their character switch.</p></div></article>
        </section>
      </main>
    );
  }

  if (loading) return <main className="app-page"><div className="app-loading"><span className="loading-spark">✦</span><strong>Opening your shared room…</strong></div></main>;
  if (!room) return <main className="app-page"><div className="content-card"><h2>This room isn't available.</h2><p>{error || 'The invitation may have expired or been cancelled.'}</p><Link to="/dashboard" className="button-primary">Back to dashboard</Link></div></main>;

  const isInvitee = room.invitedUser?._id === user._id || room.invitedUser === user._id;
  if (room.status === 'invited' && isInvitee) {
    return (
      <main className="app-page study-room-page study-invitation-page">
        <div className="page-heading-row"><div><span className="eyebrow">A LITTLE INVITATION FOR YOU</span><h1>Someone saved you a seat. <span>♡</span></h1><p>Take a look at the room before deciding to join.</p></div><Link to="/dashboard" className="text-link">Not now</Link></div>
        <section className="study-invitation-card content-card">
          <div className="study-invitation-art"><img src={roomBackground} alt="A cozy shared study room with two study desks" /><div className="invitation-art-stamp">♡ &nbsp; TWO SEATS, ONE GOAL</div></div>
          <div className="study-invitation-copy">
            <span className="eyebrow">YOUR STUDY BUDDY INVITED YOU</span>
            <h2>{room.host?.displayName || 'A friend'} wants to study with you.</h2>
            <p>You're invited to a quiet study session. You can accept now or come back later.</p>
            <div className="invitation-subject"><small>TOPIC FOR THIS SESSION</small><strong>{room.subject}</strong></div>
            <div className="session-cycle-note"><span>◷</span><div><strong>25 minutes focus + 5 minutes break</strong><small>During focus, either of you can take an individual break and the other person will see your avatar relax.</small></div></div>
            <div className="invitation-actions"><button className="button-primary" onClick={acceptInvitation} disabled={busy}>{busy ? 'Opening your seat…' : 'Accept & enter room'} <span>➜</span></button><button className="button-quiet" onClick={declineInvitation} disabled={busy}>Maybe another time</button></div>
            {error && <p className="inline-error">{error}</p>}
          </div>
        </section>
      </main>
    );
  }

  if (room.status === 'cancelled') {
    return <main className="app-page"><section className="content-card room-closed-card"><span>☁</span><h1>This little room has closed.</h1><p>The invitation or shared session is no longer active.</p><Link to="/dashboard" className="button-primary">Back to dashboard →</Link></section></main>;
  }

  const myState = room.phase === 'break' ? 'break' : (ownParticipant?.activityState || 'idle');
  const buddyState = room.phase === 'break' ? 'break' : (buddyParticipant?.activityState || 'idle');
  const phaseTotal = room.phase === 'break' ? room.breakMinutes * 60 : room.focusMinutes * 60;
  const progress = ['focus', 'break'].includes(room.phase) ? Math.min(100, Math.max(0, ((phaseTotal - remaining) / phaseTotal) * 100)) : 0;
  const phaseLabel = room.phase === 'focus' ? 'FOCUS TOGETHER' : room.phase === 'break' ? 'BREAK TIME' : room.phase === 'completed' ? 'SESSION COMPLETE' : 'WAITING FOR YOUR FRIEND';
  const friendJoined = room.participants.length === 2;

  return (
    <main className="app-page study-room-page">
      <div className="page-heading-row study-room-heading"><div><span className="eyebrow">YOUR SHARED LITTLE SPACE</span><h1>{room.subject} <span>♡</span></h1><p>{room.phase === 'waiting' ? 'Your room is ready. Your friend can join whenever they are.' : 'A quiet goal, two seats, and a little company.'}</p></div><button className="button-quiet" onClick={leave} disabled={busy}>Leave room</button></div>
      <div className="live-room-meta"><span className={`live-dot ${room.status === 'active' ? 'live' : ''}`} /><strong>{room.status === 'active' ? 'LIVE STUDY ROOM' : room.status === 'completed' ? 'SESSION FINISHED' : 'PRIVATE ROOM'}</strong><span>Room code · {room.inviteCode}</span>{friendJoined && <span className="participant-count">2 / 2 heroes</span>}</div>
      <section className="live-room-scene-card">
        <div className="live-room-scene-header"><div><strong>{user.displayName} & {buddyParticipant?.user?.displayName || 'your study buddy'}</strong><small>{room.phase === 'focus' ? 'You are focusing together.' : room.phase === 'break' ? 'A little reset for both of you.' : room.phase === 'completed' ? 'You completed a shared focus cycle.' : 'One seat is waiting for your friend.'}</small></div><span className={`phase-chip ${room.phase}`}>{phaseLabel}</span></div>
        <RoomScene avatarId={user.avatarId} state={myState} showBuddy={friendJoined} buddyAvatarId={buddyParticipant?.user?.avatarId || 'girl-01'} buddyState={buddyState} />
        <div className="room-participant-bar"><div className="room-participant"><span className={`presence-dot ${user.presence?.status === 'online' ? 'online' : ''}`} /><strong>{user.displayName}</strong><small>{myState === 'focus' ? 'Focusing' : myState === 'break' ? 'Taking a break' : 'Here'}</small></div><div className="room-participant room-participant-right">{buddyParticipant ? <><span className={`presence-dot ${buddyParticipant.user?.presence?.status === 'online' ? 'online' : ''}`} /><strong>{buddyParticipant.user?.displayName}</strong><small>{buddyState === 'focus' ? 'Focusing' : buddyState === 'break' ? 'Taking a break' : 'Here'}</small></> : <><span className="presence-dot" /><strong>Friend invited</strong><small>Waiting to join</small></>}</div></div>
      </section>

      <section className="live-session-layout">
        <article className="live-timer-card">
          <div className="timer-panel-top"><span className="eyebrow">ONE SHARED CYCLE</span><span className={`phase-pill ${room.phase === 'break' ? 'phase-break' : ''}`}>{phaseLabel}</span></div>
          <div className="timer-ring live-timer-ring" style={{ '--timer-progress': `${progress}%` }}><div><strong>{room.phase === 'waiting' ? '25:00' : formatTime(remaining)}</strong><small>{room.phase === 'break' ? 'Breathe. Stretch. Reset.' : room.phase === 'completed' ? 'Lovely work, both of you.' : 'One thing at a time.'}</small></div></div>
          <div className="timer-sequence"><span className={room.phase === 'focus' ? 'sequence-active' : ''}>25 min focus</span><i /><span className={room.phase === 'break' ? 'sequence-active' : ''}>5 min break</span></div>
          {room.status === 'waiting' && isHost && <button className="button-primary live-main-action" onClick={start} disabled={!friendJoined || busy}>{busy ? 'Starting…' : friendJoined ? 'Start together' : 'Waiting for your friend'} <span>▶</span></button>}
          {room.status === 'waiting' && !isHost && <p className="waiting-copy">The host will start the timer when you're both ready.</p>}
          {room.status === 'active' && room.phase === 'focus' && <button className="button-secondary live-main-action" onClick={toggleActivity} disabled={busy}>{myState === 'break' ? 'Back to focus' : 'Take a short break'} <span>☕</span></button>}
          {room.phase === 'break' && <p className="waiting-copy">Both avatars are on break. The shared cycle will finish when the timer reaches zero.</p>}
          {room.phase === 'completed' && <div className="cycle-complete-note"><strong>+{room.focusMinutes * 2} XP each</strong><span>Both study records have been saved.</span></div>}
        </article>
        <aside className="live-session-side"><article className="study-side-card"><span className="side-card-icon">♡</span><strong>Your friend can see your activity.</strong><p>Take a break at any point during focus. Your avatar will relax while your friend can continue working.</p></article><article className="study-side-card study-side-note"><span className="eyebrow">HOW THE CYCLE WORKS</span><ol><li><b>25 minutes</b> shared focus.</li><li><b>5 minutes</b> shared break.</li><li>During focus, either person can take an individual break and return when ready.</li></ol></article></aside>
      </section>
      {error && <p className="inline-error">{error}</p>}
      <div className="gentle-footer-note">Quiet company counts. <span>💙</span></div>
    </main>
  );
}
