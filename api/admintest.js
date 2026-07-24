export default async function handler(req, res) {
  try {
    await import('firebase-admin/app');
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message, stack: e.stack });
  }
}