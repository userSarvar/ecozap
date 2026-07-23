import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, loginIdToFakeEmail } from '../lib/firebase';

export default function Login() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!loginId.trim() || !password) {
      setError('Enter your ID and password.');
      return;
    }

    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, loginIdToFakeEmail(loginId), password);
      // AuthContext picks up the auth state change; App routes based on role.
      navigate('/', { replace: true });
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Wrong ID or password.');
      } else if (err.code === 'auth/user-disabled') {
        setError('This account has been disabled. Contact your admin.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Try again later.');
      } else {
        setError('Login failed. Try again.');
      }
    }
    setSubmitting(false);
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Ecozap</h1>
        <p className="auth-subtitle">Sign in</p>

        <label htmlFor="loginId">ID</label>
        <input
          id="loginId"
          type="text"
          autoComplete="username"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          disabled={submitting}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
        />

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
