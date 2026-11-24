import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDynamite } from '../context/DynamiteContext';
import { avatarCatalog } from './HeroAvatar';

export default function Register() {
  const { register, firebaseConfigured } = useDynamite();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('boy');
  const [avatarId, setAvatarId] = useState('boy-01');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const choices = useMemo(() => avatarCatalog.filter((avatar) => avatar.gender === gender), [gender]);
  const selected = avatarCatalog.find((avatar) => avatar.id === avatarId) || avatarCatalog[0];

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (displayName.trim().length < 2) return setError('Your Hero name needs at least two characters.');
    if (password.length < 6) return setError('Use a password with at least six characters.');
    setBusy(true);
    try {
      await register({ displayName, email, password, avatarId });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Unable to create your account.');
    } finally { setBusy(false); }
  };

  return (
    <main className="auth-page auth-page-register">
      <motion.section className="auth-card register-card register-card-wide" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <div className="auth-heading">
          <span className="eyebrow">YOUR STORY STARTS HERE</span>
          <h1>Create your Hero <span>✦</span></h1>
          <p>One account, one little world. Pick the character who will grow with you.</p>
        </div>
        {!firebaseConfigured && <div className="config-notice"><strong>One setup step first</strong><span>Add your Firebase web app values to the frontend <code>.env</code> file. The public homepage remains available until then.</span></div>}
        <form onSubmit={submit}>
          <div className="form-grid">
            <label className="form-field"><span>What should we call you?</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your display name" maxLength={30} required /></label>
            <label className="form-field"><span>Email address</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
            <label className="form-field form-field-full"><span>Create a password</span><input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" minLength={6} required /></label>
          </div>

          <div className="avatar-builder">
            <div className="avatar-builder-title"><div><span className="eyebrow">FIRST, MEET YOUR HERO</span><h2>Choose your character</h2></div><span className="choice-count">6 starter looks</span></div>
            <div className="gender-switch" role="group" aria-label="Choose avatar group">
              <button type="button" className={gender === 'boy' ? 'selected' : ''} onClick={() => { setGender('boy'); setAvatarId('boy-01'); }}>Boy heroes</button>
              <button type="button" className={gender === 'girl' ? 'selected' : ''} onClick={() => { setGender('girl'); setAvatarId('girl-01'); }}>Girl heroes</button>
            </div>
            <div className="avatar-builder-layout">
              <div className="avatar-choice-grid avatar-choice-grid-three">
                {choices.map((avatar, index) => (
                  <button type="button" key={avatar.id} className={`avatar-choice avatar-choice-card ${avatarId === avatar.id ? 'avatar-choice-selected' : ''}`} onClick={() => setAvatarId(avatar.id)}>
                    <span className="avatar-choice-check">{avatarId === avatar.id ? '✓' : ''}</span>
                    <img src={avatar.image} alt={avatar.name} />
                    <strong>{avatar.name}</strong>
                    <small>{index === 0 ? 'The original look' : index === 1 ? 'A fresh campus fit' : 'A little more you'}</small>
                  </button>
                ))}
              </div>
              <aside className="avatar-preview-panel">
                <span className="eyebrow">YOUR PREVIEW</span>
                <img src={selected.image} alt={`${selected.name} avatar preview`} />
                <strong>{displayName.trim() || 'Your Hero'}</strong>
                <small>{selected.name}</small>
                <p>Your avatar will wait in your room until you start a session.</p>
              </aside>
            </div>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="button-primary auth-submit" disabled={busy || !firebaseConfigured}>{busy ? 'Creating your world…' : 'Create my Hero'} <span>➜</span></button>
        </form>
        <p className="auth-switch">Already have a Hero? <Link to="/login">Log in</Link></p>
        <div className="auth-footnote">Your avatar selection is saved to your Dynamite account and follows you across devices.</div>
      </motion.section>
    </main>
  );
}
