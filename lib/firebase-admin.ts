import 'server-only'

import { getApps, initializeApp, cert, getApp, App } from 'firebase-admin/app'
import { getAuth, Auth } from 'firebase-admin/auth'

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp()
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  let privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (privateKey) {
    if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
      privateKey = privateKey.slice(1, -1)
    }
    privateKey = privateKey.replace(/\\n/g, '\n')
  }

  if (projectId && clientEmail && privateKey) {
    try {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      })
    } catch (error) {
      console.error('[Firebase Admin] Failed to initialize with cert credential, falling back:', error)
    }
  }

  return initializeApp({
    projectId: projectId || 'demo-project',
  })
}

export const adminApp = getAdminApp()
export const adminAuth: Auth = getAuth(adminApp)
