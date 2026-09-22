'use client'

import { useEffect, useState } from 'react'
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onIdTokenChanged,
  User as FirebaseUser,
} from 'firebase/auth'
import { auth, googleProvider } from './firebase'

export interface SessionUser {
  id: string
  email: string | null
  name: string | null
  image: string | null
}

export interface AuthSession {
  user: SessionUser
}

function syncTokenCookie(token: string | null) {
  if (typeof document === 'undefined') return
  if (token) {
    document.cookie = `firebase_token=${token}; path=/; max-age=3600; SameSite=Lax`
  } else {
    document.cookie = 'firebase_token=; path=/; max-age=0'
  }
}

export function useSession() {
  const [session, setSession] = useState<{ data: AuthSession | null; isPending: boolean }>({
    data: null,
    isPending: true,
  })

  useEffect(() => {
    // Process redirect sign in result if user returned from OAuth redirect
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const token = await result.user.getIdToken()
          syncTokenCookie(token)
          if (
            typeof window !== 'undefined' &&
            (window.location.pathname.startsWith('/sign-in') || window.location.pathname.startsWith('/sign-up'))
          ) {
            window.location.href = '/'
          }
        }
      })
      .catch((err) => {
        if (
          err?.code === 'auth/missing-initial-state' ||
          err?.message?.includes('missing initial state') ||
          err?.message?.includes('sessionStorage')
        ) {
          console.warn('[Firebase Auth] Storage partitioning prevented redirect state retrieval:', err)
        } else {
          console.warn('[Firebase Auth] Redirect auth result error:', err)
        }
      })

    const unsubscribe = onIdTokenChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        try {
          const token = await user.getIdToken()
          syncTokenCookie(token)
          setSession({
            data: {
              user: {
                id: user.uid,
                email: user.email,
                name: user.displayName || user.email?.split('@')[0] || null,
                image: user.photoURL,
              },
            },
            isPending: false,
          })
        } catch {
          syncTokenCookie(null)
          setSession({ data: null, isPending: false })
        }
      } else {
        syncTokenCookie(null)
        setSession({ data: null, isPending: false })
      }
    })

    return () => unsubscribe()
  }, [])

  return session
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    if (result?.user) {
      const token = await result.user.getIdToken()
      syncTokenCookie(token)
    }
    return result
  } catch (error: any) {
    console.warn('[Firebase Auth] Popup login failed or was blocked:', error?.code || error?.message)

    if (
      error?.code === 'auth/missing-initial-state' ||
      error?.message?.includes('missing initial state') ||
      error?.message?.includes('sessionStorage')
    ) {
      throw new Error('Your browser storage settings blocked Google Sign-In redirect. Please try signing in with Email/Password or allow third-party cookies.')
    }

    if (
      error?.code === 'auth/popup-blocked' ||
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.message?.includes('popup')
    ) {
      console.log('[Firebase Auth] Redirecting to Google login...')
      try {
        await signInWithRedirect(auth, googleProvider)
        return null
      } catch (redirectError: any) {
        if (
          redirectError?.code === 'auth/missing-initial-state' ||
          redirectError?.message?.includes('missing initial state') ||
          redirectError?.message?.includes('sessionStorage')
        ) {
          throw new Error('Your browser storage settings blocked Google Sign-In redirect. Please try signing in with Email/Password or allow third-party storage.')
        }
        throw redirectError
      }
    }
    throw error
  }
}

export async function signInWithEmail(email: string, pass: string) {
  const result = await signInWithEmailAndPassword(auth, email, pass)
  const token = await result.user.getIdToken()
  syncTokenCookie(token)
  return result
}

export async function signUpWithEmail(email: string, pass: string, name?: string) {
  const result = await createUserWithEmailAndPassword(auth, email, pass)
  if (name && result.user) {
    await updateProfile(result.user, { displayName: name })
  }
  const token = await result.user.getIdToken()
  syncTokenCookie(token)
  return result
}

export async function getAuthToken(): Promise<string | null> {
  if (!auth.currentUser) return null
  try {
    const token = await auth.currentUser.getIdToken()
    syncTokenCookie(token)
    return token
  } catch {
    return null
  }
}

export async function signOut(options?: { fetchOptions?: { onSuccess?: () => void } }) {
  await firebaseSignOut(auth)
  syncTokenCookie(null)
  if (options?.fetchOptions?.onSuccess) {
    options.fetchOptions.onSuccess()
  }
}

export const authClient = {
  useSession,
  signOut,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  getAuthToken,
}
