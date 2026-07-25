export default async function handler(req, res) {
  try {
    const { cert, initializeApp, getApps } = await import('firebase-admin/app');
    const { getAuth } = await import('firebase-admin/auth');
    const { getFirestore } = await import('firebase-admin/firestore');

    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_B64;
    const serviceAccount = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));

    if (!getApps().length) {
      initializeApp({ credential: cert(serviceAccount) });
    }

    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match) {
      return res.status(200).json({ step: 'no auth header', hasHeader: !!authHeader });
    }

    let decoded;
    try {
      decoded = await getAuth().verifyIdToken(match[1]);
    } catch (e) {
      return res.status(200).json({ step: 'verifyIdToken failed', error: e.message, code: e.code });
    }

    let userDoc;
    try {
      userDoc = await getFirestore().collection('users').doc(decoded.uid).get();
    } catch (e) {
      return res.status(200).json({ step: 'firestore get failed', error: e.message, code: e.code });
    }

    return res.status(200).json({
      step: 'all good',
      uid: decoded.uid,
      docExists: userDoc.exists,
      docData: userDoc.exists ? userDoc.data() : null,
    });
  } catch (e) {
    return res.status(200).json({ step: 'top level catch', error: e.message, stack: e.stack });
  }
}