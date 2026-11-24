import { Link } from 'react-router-dom';
import { useDynamite } from '../context/DynamiteContext';
import RoomScene from './room/RoomScene';

export default function Workspace() {
  const { user } = useDynamite();
  return (
    <main className="app-page workspace-page">
      <div className="page-heading-row"><div><span className="eyebrow">YOUR PERSONAL CORNER</span><h1>My Room <span>⌂</span></h1><p>A quiet space that belongs to you.</p></div><span className="room-weather">☀ A calm little day</span></div>
      <section className="workspace-scene-card"><div className="workspace-scene-head"><div><strong>{user.displayName}'s study room</strong><small>Your Hero is sitting comfortably, waiting for you.</small></div><span className="idle-pill"><i /> IDLE</span></div><RoomScene avatarId={user.avatarId} /></section>
      <section className="workspace-actions"><article><span className="workspace-action-icon">◷</span><div><strong>Study together</strong><p>Invite a friend and share a focused session.</p></div><Link to="/study-room">Invite a friend →</Link></article><article><span className="workspace-action-icon">♡</span><div><strong>Invite someone over</strong><p>Share your UID, add a friend and invite them to this room.</p></div><Link to="/friends">Find a study buddy →</Link></article></section>
    </main>
  );
}
