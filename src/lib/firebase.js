import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Users log in with a plain loginId (not an email). We convert it to a fake
// email under a fixed fake domain to use under Firebase Auth. Must match
// the same logic used in api/createViewer.js on the backend.
export const FAKE_EMAIL_DOMAIN = 'ecozap.local';

export function loginIdToFakeEmail(loginId) {
  return `${loginId.trim().toLowerCase()}@${FAKE_EMAIL_DOMAIN}`;
}
