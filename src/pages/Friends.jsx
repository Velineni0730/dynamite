import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, jsonRequest } from '../lib/api';
import { useDynamite } from '../context/DynamiteContext';
import HeroAvatar from '../components/HeroAvatar';

export default function Friends() {
  const { user, friends, friendRequests, refreshFriends } = useDynamite();
  const navigate = useNavigate();
  const [uid, setUid] = useState('');
  const [subjectByFriend, setSubjectByFriend] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { refreshFriends().catch((err) => setError(err.message)); }, [refreshFriends]);

  const sendRequest = async (event) => {
    event.preventDefault(); setMessage(''); setError(''); setBusy(true);
    try {
      const result = await api('/friends/requests', jsonRequest('POST', { publicUid: uid }));
      setMessage(result.message || 'Friend request sent.'); setUid(''); await refreshFriends();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const accept = async (id) => {
    setError('');
    try { await api(`/friends/requests/${id}/accept`, { method: 'POST' }); await refreshFriends(); }
    catch (err) { setError(err.message); }
  };
  const decline = async (id) => {
    try { await api(`/friends/requests/${id}`, { method: 'DELETE' }); await refreshFriends(); }
    catch (err) { setError(err.message); }
  };

  const invite = async (friend) => {
    setError(''); setBusy(true);
    try {
      const subject = subjectByFriend[friend._id]?.trim() || 'A little study session';
      const result = await api('/study-rooms', jsonRequest('POST', { friendId: friend._id, subject, title: `${user.displayName} & ${friend.displayName}'s study room` }));
      navigate(`/study-room/${result.room._id}`);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <main className="app-page friends-page">
      <div className="page-heading-row"><div><span className="eyebrow">YOUR STUDY PEOPLE</span><h1>Friends & study buddies <span>♡</span></h1><p>Add a friend with their Dynamite UID, then invite them into your shared room.</p></div><span className="friends-count-chip">{friends.length} friends</span></div>

      <section className="friends-uid-panel">
        <div className="uid-panel-copy"><span className="eyebrow">YOUR UNIQUE DYNAMITE UID</span><strong>{user.publicUid}</strong><p>Share this code with friends so they can find your account.</p></div>
        <button className="button-primary" onClick={() => navigator.clipboard?.writeText(user.publicUid).then(() => setMessage('Your UID has been copied.')).catch(() => setError('Clipboard access unavailable.'))}>Copy my UID <span>⧉</span></button>
      </section>

      <section className="add-friend-panel content-card">
        <div><span className="eyebrow">MAKE THE FIRST MOVE</span><h2>Add a friend</h2><p>Enter their Dynamite UID exactly as they shared it with you.</p></div>
        <form className="add-friend-form" onSubmit={sendRequest}><input value={uid} onChange={(event) => setUid(event.target.value.toUpperCase())} placeholder="DYN-XXXXXXXX" maxLength={12} aria-label="Friend Dynamite UID" required /><button className="button-primary" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send request'} <span>➜</span></button></form>
        {message && <p className="success-message">{message}</p>}{error && <p className="inline-error">{error}</p>}
      </section>

      {friendRequests.incoming?.length > 0 && <section className="friend-requests-section"><div className="section-heading-inline"><div><span className="eyebrow">YOUR INBOX</span><h2>Incoming requests</h2></div><span className="task-count">{friendRequests.incoming.length}</span></div><div className="friend-request-list">{friendRequests.incoming.map((request) => <article className="friend-request-card" key={request._id}><div className="friend-avatar-small"><HeroAvatar avatarId={request.from.avatarId} /></div><div className="friend-request-info"><strong>{request.from.displayName}</strong><small>{request.from.publicUid} · wants to be friends</small></div><button className="button-primary button-small" onClick={() => accept(request._id)}>Accept</button><button className="button-quiet button-small" onClick={() => decline(request._id)}>Decline</button></article>)}</div></section>}
      {friendRequests.outgoing?.length > 0 && <section className="friend-requests-section"><div className="section-heading-inline"><div><span className="eyebrow">WAITING FOR A REPLY</span><h2>Sent requests</h2></div><span className="task-count">{friendRequests.outgoing.length}</span></div><div className="friend-request-list">{friendRequests.outgoing.map((request) => <article className="friend-request-card" key={request._id}><div className="friend-avatar-small"><HeroAvatar avatarId={request.to.avatarId} /></div><div className="friend-request-info"><strong>{request.to.displayName}</strong><small>{request.to.publicUid} · request sent</small></div><span className="presence-pill">Pending</span></article>)}</div></section>}

      <section className="friends-list-section"><div className="section-heading-inline"><div><span className="eyebrow">YOUR LITTLE CIRCLE</span><h2>Friends</h2></div><span className="task-count">{friends.length}</span></div>
        {friends.length ? <div className="friends-grid">{friends.map((friend) => <article className="friend-card" key={friend._id}><div className="friend-card-top"><div className="friend-avatar-large"><HeroAvatar avatarId={friend.avatarId} /></div><span className={`presence-pill ${friend.presence?.status === 'online' ? 'is-online' : ''}`}><i />{friend.presence?.status === 'online' ? 'Online' : 'Offline'}</span></div><strong>{friend.displayName}</strong><small>{friend.publicUid}</small><p>{friend.presence?.activityState === 'focus' ? 'Currently focusing' : friend.presence?.activityState === 'break' ? 'Taking a break' : 'A study buddy in your circle'}</p><label className="friend-subject-label">What are you studying together?<input value={subjectByFriend[friend._id] || ''} onChange={(event) => setSubjectByFriend((current) => ({ ...current, [friend._id]: event.target.value }))} placeholder="e.g. DBMS — BCNF" /></label><button className="button-primary friend-invite-button" onClick={() => invite(friend)} disabled={busy}>Invite to study <span>♡</span></button></article>)}</div> : <div className="friends-empty content-card"><span>☁</span><h3>Your study circle starts with one person.</h3><p>Share your UID with a friend or add theirs above. Once they accept, you can invite them into your room.</p><Link to="/dashboard" className="text-link">Back to your dashboard →</Link></div>}
      </section>
      <div className="gentle-footer-note">Good company makes small steps feel lighter. <span>💙</span></div>
    </main>
  );
}
