import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDynamite } from '../context/DynamiteContext';
import HeroAvatar from './HeroAvatar';

export default function Login() {
  const { login, firebaseConfigured } = useDynamite();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
    } finally { setBusy(false); }
  };

  return (
    <main className="auth-page">
      <motion.section className="auth-card login-card login-card-new" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <div className="login-avatar-orbit"><div className="login-avatar-circle"><HeroAvatar avatarId="boy-01" /></div><span>✦</span><i>♡</i></div>
        <div className="auth-heading"><span className="eyebrow">WELCOME BACK, HERO</span><h1>Your room missed you.</h1><p>Sign in and pick up right where you left off.</p></div>
        {!firebaseConfigured && <div className="config-notice"><strong>Firebase setup required</strong><span>Configure the Firebase web app values in your frontend <code>.env</code> file.</span></div>}
        <form onSubmit={submit}>
          <label className="form-field"><span>Email address</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
          <label className="form-field"><span>Password</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="button-primary auth-submit" disabled={busy || !firebaseConfigured}>{busy ? 'Opening your room…' : 'Continue to Dynamite'} <span>➜</span></button>
        </form>
        <p className="auth-switch">New around here? <Link to="/register">Create your Hero</Link></p>
      </motion.section>
    </main>
  );
}
