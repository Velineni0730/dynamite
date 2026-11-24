import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDynamite } from '../context/DynamiteContext';
import { api } from '../lib/api';
import RoomScene from './room/RoomScene';

export default function Dashboard() {
  const { user, friends, refreshFriends, refreshProfile } = useDynamite();
  const [sessions, setSessions] = useState([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    api('/focus-sessions').then((result) => setSessions(result.sessions || [])).catch((err) => setError(err.message));
    refreshFriends().catch(() => {});
    refreshProfile().catch(() => {});
  }, [refreshFriends, refreshProfile]);

  const copyUid = async () => {
    try { await navigator.clipboard.writeText(user.publicUid); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    catch { setError('Clipboard access is unavailable in this browser.'); }
  };
  const xp = user.xp || 0;
  const level = Math.max(1, user.level || 1);
  const currentStart = (level - 1) ** 2 * 100;
  const nextLevel = level ** 2 * 100;
  const progress = Math.min(100, ((xp - currentStart) / Math.max(1, nextLevel - currentStart)) * 100);

  return (
    <main className="app-page dashboard-page">
      <div className="page-heading-row"><div><span className="eyebrow">YOUR LITTLE WORLD</span><h1>{greeting}, {user.displayName} <span>✦</span></h1><p>Your space is ready whenever you are.</p></div><div className="level-chip"><span>✦</span><div><strong>Level {level}</strong><small>{xp} XP earned</small></div></div></div>

      <section className="dashboard-top-grid">
        <article className="dashboard-room-card"><div className="card-heading"><div><span className="eyebrow">YOUR ROOM</span><h2>{user.activeRoom ? 'Your study room is still here.' : 'Your Hero is waiting.'}</h2><p>{user.activeRoom ? 'Your room is ready to reopen whenever you are.' : 'Your avatar is resting until you decide to begin.'}</p></div><span className="idle-pill"><i /> IDLE</span></div>
          <RoomScene avatarId={user.avatarId} compact />
          <div className="room-card-actions"><Link to={user.activeRoom ? `/study-room/${user.activeRoom}` : '/room'} className="button-primary">{user.activeRoom ? 'Reopen study room' : 'Enter my room'} <span>➜</span></Link><span className="subtle-copy">Your Hero never starts studying automatically.</span></div>
        </article>
        <aside className="dashboard-side-stack">
          <article className="soft-stat-card stat-focus"><span className="stat-icon">◷</span><small>FOCUS TIME</small><strong>{user.totalFocusMinutes || 0} <em>min</em></strong><p>Time spent in completed sessions</p></article>
          <article className="soft-stat-card stat-sessions"><span className="stat-icon">✦</span><small>SESSIONS COMPLETED</small><strong>{user.completedSessions || 0}</strong><p>Every completed cycle counts</p></article>
          <article className="xp-card"><div><span className="eyebrow">YOUR NEXT LEVEL</span><strong>Level {level + 1}</strong></div><span>{Math.max(0, nextLevel - xp)} XP to go</span><div className="xp-track"><i style={{ width: `${progress}%` }} /></div></article>
        </aside>
      </section>

      <section className="dashboard-bottom-grid">
        <article className="content-card together-card"><span className="eyebrow">YOUR DYNAMITE ID</span><h2>Find your study people.</h2><p>Share this UID with a friend, or add theirs to make your first study invitation.</p><div className="uid-copy-card"><div><small>YOUR UNIQUE UID</small><strong>{user.publicUid}</strong></div><button onClick={copyUid}>{copied ? 'Copied ✓' : 'Copy UID'}</button></div><div className="friends-mini-row"><div><strong>{friends.length}</strong><span>friends</span></div><Link to="/friends" className="text-link">Open friends →</Link></div></article>
        <article className="content-card recent-card"><div className="content-card-header"><div><span className="eyebrow">LITTLE WINS</span><h2>Recent focus sessions</h2></div><span className="task-count">{sessions.length}</span></div>
          {sessions.length ? <div className="recent-session-list">{sessions.slice(0, 4).map((session) => <div className="recent-session-row" key={session._id}><span className="session-dot">✦</span><div><strong>{session.subject}</strong><small>{new Date(session.completedAt).toLocaleDateString()} · {session.actualDuration} min</small></div><b>+{session.xpEarned} XP</b></div>)}</div> : <div className="empty-state-inline"><span>☁</span><strong>Your first focus session is waiting.</strong><small>Start a 25-minute study cycle alone or with a friend.</small><Link to="/study-room" className="text-link">Start a session →</Link></div>}
        </article>
      </section>
      <section className="dashboard-quick-actions"><Link to="/room"><span>⌂</span><div><strong>My Room</strong><small>Visit your personal space</small></div></Link><Link to="/friends"><span>♡</span><div><strong>Friends</strong><small>Find your study people</small></div></Link><Link to="/study-room"><span>◷</span><div><strong>Study Together</strong><small>Invite someone to focus</small></div></Link></section>
      {error && <p className="inline-error">{error}</p>}
      <div className="gentle-footer-note">Focus on progress, not perfection. <span>💛</span></div>
    </main>
  );
}
