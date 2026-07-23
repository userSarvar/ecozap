import { auth } from './firebase';

/**
 * Calls one of our /api/* serverless functions, attaching the current user's
 * Firebase ID token as a Bearer token. Throws with the server's error message
 * on non-2xx responses.
 */
export async function callApi(path, body) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Not signed in');
  }

  const idToken = await user.getIdToken();

  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
}
