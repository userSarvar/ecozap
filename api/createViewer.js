import { adminAuth, adminDb, requireAdmin } from './_firebaseAdmin.js';

// Users log in with a plain "loginId" (like a username), not an email. We
// convert it to a fake email under a fixed fake domain so we can use real
// Firebase Auth underneath without the user ever seeing/knowing this.
const FAKE_EMAIL_DOMAIN = 'ecozap.local';

function loginIdToFakeEmail(loginId) {
  return `${loginId.trim().toLowerCase()}@${FAKE_EMAIL_DOMAIN}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await requireAdmin(req);
  } catch (err) {
    return res.status(err.statusCode || 401).json({ error: err.message });
  }

  const { loginId, password, alias } = req.body || {};

  if (typeof loginId !== 'string' || !/^[a-zA-Z0-9_.-]{3,30}$/.test(loginId.trim())) {
    return res.status(400).json({
      error: 'loginId must be 3-30 characters, letters/numbers/._- only',
    });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters' });
  }
  if (typeof alias !== 'string' || !alias.trim()) {
    return res.status(400).json({ error: 'alias is required' });
  }

  const fakeEmail = loginIdToFakeEmail(loginId);

  try {
    const userRecord = await adminAuth().createUser({
      email: fakeEmail,
      password,
      displayName: alias.trim(),
    });

    // Always created as role: 'viewer'. There's no client-facing way to
    // create another admin — that stays a manual, deliberate Firebase Console step.
    await adminDb().collection('users').doc(userRecord.uid).set({
      loginId: loginId.trim(),
      alias: alias.trim(),
      role: 'viewer',
      active: true,
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      uid: userRecord.uid,
      loginId: loginId.trim(),
      alias: alias.trim(),
    });
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: 'That login ID is already taken' });
    }
    return res.status(500).json({ error: err.message || 'Failed to create viewer account' });
  }
}
