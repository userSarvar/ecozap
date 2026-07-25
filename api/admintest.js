export default async function handler(req, res) {
  try {
    const { cert, initializeApp, getApps } = await import('firebase-admin/app');

    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_B64;
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!b64 && !raw) {
      return res.status(500).json({ error: 'no env var set at all', hasB64: !!b64, hasRaw: !!raw });
    }

    let jsonStr;
    if (b64) {
      jsonStr = Buffer.from(b64, 'base64').toString('utf8');
    } else {
      jsonStr = raw;
    }

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(jsonStr);
    } catch (e) {
      return res.status(500).json({
        error: 'JSON.parse failed',
        message: e.message,
        first100chars: jsonStr.slice(0, 100),
      });
    }

    if (!getApps().length) {
      initializeApp({ credential: cert(serviceAccount) });
    }

    return res.status(200).json({
      ok: true,
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message, stack: e.stack });
  }
}