import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminApp() {
  if (getApps().length) return getApps()[0];

  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_B64;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  let jsonStr;
  if (b64) {
    jsonStr = Buffer.from(b64, 'base64').toString('utf8');
  } else if (raw) {
    jsonStr = raw;
  } else {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY(_B64) env var is missing');
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON. If pasted directly, it must be the ' +
      'minified single-line JSON (private_key using literal \\n). Prefer setting ' +
      'FIREBASE_SERVICE_ACCOUNT_KEY_B64 (base64 of the whole JSON file) instead.'
    );
  }

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

export function adminAuth() {
  return getAuth(getAdminApp());
}

export function adminDb() {
  return getFirestore(getAdminApp());
}

export async function requireAdmin(req) {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) {
    const err = new Error('Missing Authorization header');
    err.statusCode = 401;
    throw err;
  }

  const idToken = match[1];
  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(idToken);
  } catch (e) {
    const err = new Error('Invalid or expired token');
    err.statusCode = 401;
    throw err;
  }

  const userDoc = await adminDb().collection('users').doc(decoded.uid).get();
  if (!userDoc.exists || userDoc.data().role !== 'admin' || userDoc.data().active !== true) {
    const err = new Error('Caller is not an active admin');
    err.statusCode = 403;
    throw err;
  }

  return { uid: decoded.uid, userData: userDoc.data() };
}