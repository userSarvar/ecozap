import { adminDb, requireAdmin } from './_firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let caller;
  try {
    caller = await requireAdmin(req);
  } catch (err) {
    return res.status(err.statusCode || 401).json({ error: err.message });
  }

  const { partId, quantity, carModel, plateNumber, sellPrice, customerPhone } = req.body || {};

  // ---- Input validation (never trust the client) ----
  if (typeof partId !== 'string' || !partId.trim()) {
    return res.status(400).json({ error: 'partId is required' });
  }
  if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
    return res.status(400).json({ error: 'quantity must be a positive whole number' });
  }
  if (typeof sellPrice !== 'number' || !Number.isFinite(sellPrice) || sellPrice < 0) {
    return res.status(400).json({ error: 'sellPrice must be a non-negative number' });
  }
  if (typeof carModel !== 'string' || !carModel.trim()) {
    return res.status(400).json({ error: 'carModel is required' });
  }
  if (typeof plateNumber !== 'string' || !plateNumber.trim()) {
    return res.status(400).json({ error: 'plateNumber is required' });
  }
  if (typeof customerPhone !== 'string' || !customerPhone.trim()) {
    return res.status(400).json({ error: 'customerPhone is required' });
  }

  const db = adminDb();
  const partRef = db.collection('parts').doc(partId);
  const exportRef = db.collection('exports').doc();

  try {
    await db.runTransaction(async (tx) => {
      const partSnap = await tx.get(partRef);

      if (!partSnap.exists) {
        throw Object.assign(new Error('Part not found'), { statusCode: 404 });
      }

      const part = partSnap.data();
      const available = part.quantity;

      if (available < quantity) {
        throw Object.assign(
          new Error(`Not enough stock. Available: ${available}, requested: ${quantity}`),
          { statusCode: 409 }
        );
      }

      // Decrement stock
      tx.update(partRef, {
        quantity: available - quantity,
        updatedAt: new Date(),
      });

      // Create export record. performedBy comes from the verified token, not
      // the client body, so it can't be spoofed.
      tx.set(exportRef, {
        partId,
        partName: part.name,
        quantity,
        carModel: carModel.trim(),
        plateNumber: plateNumber.trim(),
        sellPrice,
        customerPhone: customerPhone.trim(),
        performedBy: caller.uid,
        performedByAlias: caller.userData.alias,
        timestamp: new Date(),
      });
    });

    return res.status(200).json({ success: true, exportId: exportRef.id });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ error: err.message || 'Export failed' });
  }
}
