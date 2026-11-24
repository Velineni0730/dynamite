import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useDynamite } from '../context/DynamiteContext';
import { getAvatarSource } from './HeroAvatar';
import dynamiteIcon from '../assets/dynamite-mark.png';

export default function Navbar() {
  const { user, logout, notifications, unreadCount, refreshNotifications, markNotificationRead } = useDynamite();
  const [scrollMode, setScrollMode] = useState('expanded');
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let previous = window.scrollY;
    const onScroll = () => {
      const current = window.scrollY;
      if (current < 70) setScrollMode('expanded');
      else if (current > previous + 4) setScrollMode('collapsed');
      else if (current < previous - 4) setScrollMode('expanded');
      previous = current;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setNotificationsOpen(false); setProfileOpen(false); setMenuOpen(false); }, [location.pathname]);

  const navItems = user
    ? [
        { to: '/dashboard', label: 'My Dashboard', icon: '▦' },
        { to: '/room', label: 'My Room', icon: '⌂' },
        { to: '/friends', label: 'Friends', icon: '♡' },
        { to: '/study-room', label: 'Study Together', icon: '◷' },
      ]
    : [
        { to: '/', label: 'Home', icon: '⌂' },
        { to: '/#how-it-works', label: 'How it works', icon: '✦' },
        { to: '/#study-together', label: 'Study together', icon: '♡' },
      ];

  const goTo = (to) => {
    if (to.includes('#')) {
      const [path, hash] = to.split('#');
      if (location.pathname !== (path || '/')) navigate(path || '/');
      window.setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else navigate(to);
    setMenuOpen(false); setNotificationsOpen(false); setProfileOpen(false);
  };

  const openNotifications = async () => {
    const next = !notificationsOpen;
    setNotificationsOpen(next); setProfileOpen(false);
    if (next) refreshNotifications().catch(() => {});
  };

  const handleNotification = async (item) => {
    try { if (!item.read) await markNotificationRead(item._id); } catch { /* navigation still works */ }
    setNotificationsOpen(false);
    if (item.type === 'study_invite' && item.data?.roomId) navigate(`/study-room/${item.data.roomId}`);
    else if (item.type === 'friend_request' || item.type === 'friend_accepted') navigate('/friends');
    else navigate('/dashboard');
  };

  const doLogout = async () => {
    try { await logout(); navigate('/'); } catch { navigate('/'); }
  };

  return (
    <>
      <AnimatePresence>
        {scrollMode === 'expanded' && (
          <motion.header className="dynamite-navbar" initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -24, opacity: 0 }} transition={{ duration: 0.24, ease: 'easeOut' }}>
            <div className="nav-left">
              {user ? <>
                <div className="nav-popover-anchor"><button className="nav-icon-button notification-trigger" aria-label={`Notifications, ${unreadCount} unread`} onClick={openNotifications}>🔔{unreadCount > 0 && <i>{unreadCount > 9 ? '9+' : unreadCount}</i>}</button>
                  {notificationsOpen && <div className="notification-popover"><div className="popover-head"><strong>Your little updates</strong><button onClick={() => refreshNotifications().catch(() => {})}>↻</button></div>{notifications.length ? notifications.slice(0, 6).map((item) => <button className={`notification-item ${item.read ? '' : 'unread'}`} key={item._id} onClick={() => handleNotification(item)}><span className="notification-item-icon">{item.type === 'study_invite' ? '♡' : item.type === 'friend_request' ? '✧' : '✦'}</span><span><strong>{item.title}</strong><small>{item.message}</small></span><i /></button>) : <p className="notification-empty">No updates yet. Your friend requests and study invitations will appear here.</p>}</div>}
                </div>
                <div className="nav-popover-anchor"><button className="nav-profile" onClick={() => { setProfileOpen((open) => !open); setNotificationsOpen(false); }} title={user.displayName}><img src={getAvatarSource(user.avatarId, 'idle')} alt="Your Hero avatar" /></button>
                  {profileOpen && <div className="profile-popover"><strong>{user.displayName}</strong><small>{user.publicUid}</small><button onClick={() => goTo('/dashboard')}>My dashboard</button><button onClick={() => goTo('/friends')}>My friends</button><button onClick={doLogout}>Log out</button></div>}
                </div>
              </> : <><Link className="nav-login" to="/login">Log in</Link><Link className="nav-join" to="/register">Create your Hero <span>→</span></Link></>}
            </div>
            <nav className="nav-links" aria-label="Main navigation">{navItems.map((item) => <button key={item.label} onClick={() => goTo(item.to)} className={`nav-link ${location.pathname === item.to.split('#')[0] ? 'nav-link-active' : ''}`}><span>{item.icon}</span>{item.label}</button>)}</nav>
            <Link to={user ? '/dashboard' : '/'} className="nav-brand" aria-label="Dynamite home"><span className="nav-brand-icon"><img src={dynamiteIcon} alt="" /></span><span className="nav-brand-copy"><strong>DYNAMITE <em>✦</em></strong><small>YOUR STUDY HERO ♥</small></span></Link>
          </motion.header>
        )}
      </AnimatePresence>
      {scrollMode === 'collapsed' && <motion.div className="nav-mini-wrap" initial={{ opacity: 0, scale: 0.8, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }}><button className="nav-mini" onClick={() => setMenuOpen((open) => !open)} aria-label="Open navigation"><img src={dynamiteIcon} alt="Dynamite menu" /></button>{menuOpen && <motion.div className="nav-mini-menu" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>{navItems.map((item) => <button key={item.label} onClick={() => goTo(item.to)}>{item.icon} {item.label}</button>)}{user ? <button onClick={doLogout}>↪ Log out</button> : <Link to="/register">Create your Hero →</Link>}</motion.div>}</motion.div>}
    </>
  );
}
