import { adminAuth, adminDb, requireAdmin } from './_firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await requireAdmin(req);
  } catch (err) {
    return res.status(err.statusCode || 401).json({ error: err.message });
  }

  const { userUid, active } = req.body || {};

  if (typeof userUid !== 'string' || !userUid.trim()) {
    return res.status(400).json({ error: 'userUid is required' });
  }
  if (typeof active !== 'boolean') {
    return res.status(400).json({ error: 'active must be true or false' });
  }

  try {
    const targetDoc = await adminDb().collection('users').doc(userUid).get();
    if (targetDoc.exists && targetDoc.data().role === 'admin') {
      return res.status(400).json({ error: 'Cannot disable an admin account through this endpoint' });
    }

    // Disable in Firebase Auth (blocks login entirely, belt-and-suspenders
    // alongside the Firestore `active` flag our functions also check).
    await adminAuth().updateUser(userUid, { disabled: !active });

    await adminDb().collection('users').doc(userUid).update({
      active,
      updatedAt: new Date(),
    });

    return res.status(200).json({ success: true, userUid, active });
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'Account not found' });
    }
    return res.status(500).json({ error: err.message || 'Failed to update account' });
  }
}
