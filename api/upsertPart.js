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

  const { partId, name, quantity, price } = req.body || {};

  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity < 0 || !Number.isInteger(quantity)) {
    return res.status(400).json({ error: 'quantity must be a whole number, 0 or more' });
  }
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
    return res.status(400).json({ error: 'price must be a non-negative number' });
  }

  const db = adminDb();
  const historyRef = db.collection('history').doc();
  const trimmedName = name.trim();

  try {
    if (!partId) {
      const partRef = db.collection('parts').doc();

      await db.runTransaction(async (tx) => {
        tx.set(partRef, {
          name: trimmedName,
          quantity,
          price,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        tx.set(historyRef, {
          type: 'new',
          partId: partRef.id,
          partName: trimmedName,
          quantity,
          price,
          performedBy: caller.uid,
          performedByAlias: caller.userData.alias,
          timestamp: new Date(),
        });
      });

      return res.status(200).json({ success: true, partId: partRef.id });
    }

    const partRef = db.collection('parts').doc(partId);

    await db.runTransaction(async (tx) => {
      const partSnap = await tx.get(partRef);
      if (!partSnap.exists) {
        throw Object.assign(new Error('Part not found'), { statusCode: 404 });
      }

      const before = partSnap.data();
      const changed = before.quantity !== quantity || before.price !== price;

      tx.update(partRef, {
        name: trimmedName,
        quantity,
        price,
        updatedAt: new Date(),
      });

      if (changed) {
        tx.set(historyRef, {
          type: 'edit',
          partId,
          partName: trimmedName,
          quantity,
          price,
          previousQuantity: before.quantity,
          previousPrice: before.price,
          performedBy: caller.uid,
          performedByAlias: caller.userData.alias,
          timestamp: new Date(),
        });
      }
    });

    return res.status(200).json({ success: true, partId });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ error: err.message || 'Save failed' });
  }
}