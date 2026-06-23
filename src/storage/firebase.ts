import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  Firestore,
  getFirestore
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

import config from '../../firebase-applet-config.json';

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

try {
  app = getApps().length === 0 ? initializeApp(config) : getApp();
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
  auth = getAuth(app);
} catch (error) {
  console.error("Failed to initialize Firebase SDK:", error);
  // Fallback to basic init if persistent cache fails (e.g. in private browsing)
  try {
    app = getApps().length === 0 ? initializeApp(config) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (err2) {
    console.error("Critical fallback failed:", err2);
    // Stub to avoid breaking imports
    app = null as any;
    db = null as any;
    auth = null as any;
  }
}

export { app, db, auth };
