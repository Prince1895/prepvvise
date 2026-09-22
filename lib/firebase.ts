import { getApps, initializeApp, getApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1234567890:web:demo',
}

export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)

if (typeof window !== 'undefined') {
  setPersistence(auth, indexedDBLocalPersistence).catch(() => {
    setPersistence(auth, browserLocalPersistence).catch(() => {})
  })
}

export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })
