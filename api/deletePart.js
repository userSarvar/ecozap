import { adminDb, requireAdmin } from './_firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let caller;
  try {
    caller = await requireAdmin(req);
  } catch (err) {
    console.error('requireAdmin failed:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Auth check failed' });
  }

  const { partId } = req.body || {};
  if (typeof partId !== 'string' || !partId.trim()) {
    return res.status(400).json({ error: 'partId is required' });
  }

  const db = adminDb();
  const partRef = db.collection('parts').doc(partId);

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(partRef);
      if (!snap.exists) {
        throw Object.assign(new Error('Part not found'), { statusCode: 404 });
      }
      const part = snap.data();
      if (part.quantity !== 0) {
        throw Object.assign(
          new Error(`Can only delete a part when its quantity is 0 (currently ${part.quantity}).`),
          { statusCode: 409 }
        );
      }
      tx.delete(partRef);
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ error: err.message || 'Delete failed' });
  }
}