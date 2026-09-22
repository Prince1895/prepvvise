'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { signInWithEmail, signInWithGoogle, authClient } from '@/lib/auth-client'

export default function SignInPage() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session?.user) {
      window.location.href = '/'
    }
  }, [session])

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signInWithEmail(email, password)
      window.location.href = '/'
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in.')
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await signInWithGoogle()
      if (res?.user) {
        window.location.href = '/'
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google.')
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-column">
        <div className="auth-brand">
          <span className="auth-brand-mark"><Sparkles /></span>
          <span>prepvvise</span>
          <span className="brand-beta">BETA</span>
        </div>

        <div className="auth-card" style={{ width: '100%', maxWidth: '400px', margin: '0 auto', padding: '1.5rem', background: 'var(--card-bg, rgba(255,255,255,0.05))', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', textAlign: 'center' }}>Sign in to your account</h2>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '6px', fontSize: '0.875rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="secondary-button"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', padding: '0.625rem' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ padding: '0 0.5rem' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          </div>

          <form onSubmit={handleEmailSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', opacity: 0.8 }}>Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ width: '100%', padding: '0.625rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: 'inherit' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', opacity: 0.8 }}>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '0.625rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: 'inherit' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="primary-button"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.625rem' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem' }}>
            <span style={{ opacity: 0.8 }}>Don&apos;t have an account?</span>{' '}
            <a href="/sign-up" style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
              Sign up
            </a>
          </p>
        </div>

        <p className="auth-footnote">Practice with intention. Improve with evidence.</p>
      </div>
    </main>
  )
}
