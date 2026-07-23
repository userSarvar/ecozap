import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Service account key is stored as a single JSON string in the Vercel env var
// FIREBASE_SERVICE_ACCOUNT_KEY (paste the whole downloaded JSON key as the value).
function getAdminApp() {
  if (getApps().length) return getApps()[0];

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY env var is missing');
  }

  const serviceAccount = JSON.parse(raw);

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

/**
 * Verifies the request's Firebase ID token (sent as "Authorization: Bearer <token>")
 * and confirms the caller is an admin by checking their /users/{uid} doc.
 * Throws if not authenticated or not admin. Use this at the top of every
 * admin-only endpoint (which, in this app, is every endpoint that writes data —
 * admin is the only role that imports or exports parts).
 */
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
