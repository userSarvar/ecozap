import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { callApi } from '../lib/api';

export default function AdminViewers() {
  const [userList, setUserList] = useState([]);

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [alias, setAlias] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('alias'));
    const unsub = onSnapshot(q, (snap) => {
      setUserList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(loginId.trim())) {
      setError('Login ID must be 3-30 characters: letters, numbers, . _ - only.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!alias.trim()) {
      setError('Alias (display name) is required.');
      return;
    }

    setSubmitting(true);
    try {
      await callApi('/api/createViewer', { loginId, password, alias });
      setSuccess(`Viewer account "${alias}" created.`);
      setLoginId('');
      setPassword('');
      setAlias('');
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  }

  async function handleToggle(userUid, currentlyActive) {
    setError('');
    try {
      await callApi('/api/toggleUser', { userUid, active: !currentlyActive });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <h2>Manage viewers</h2>

      <form className="form-card" onSubmit={handleCreate}>
        <h3>Create viewer account</h3>

        <label htmlFor="loginId">Login ID</label>
        <input id="loginId" type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} disabled={submitting} />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
        />

        <label htmlFor="alias">Alias (display name)</label>
        <input id="alias" type="text" value={alias} onChange={(e) => setAlias(e.target.value)} disabled={submitting} />

        {error && <p className="error-text">{error}</p>}
        {success && <p className="success-text">{success}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create viewer account'}
        </button>
      </form>

      <h3>Accounts</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Alias</th>
            <th>Login ID</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {userList.map((u) => (
            <tr key={u.id}>
              <td>{u.alias}</td>
              <td>{u.loginId}</td>
              <td>{u.role}</td>
              <td>{u.active ? 'Active' : 'Disabled'}</td>
              <td>
                {u.role !== 'admin' && (
                  <button onClick={() => handleToggle(u.id, u.active)}>
                    {u.active ? 'Disable' : 'Enable'}
                  </button>
                )}
              </td>
            </tr>
          ))}
          {userList.length === 0 && (
            <tr>
              <td colSpan={5}>No accounts yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
