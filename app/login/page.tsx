'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else router.push('/')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.push('/')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-2xl block text-center mb-8" style={{ color: 'var(--ink)' }}>
          Trailhead
        </Link>

        <div
          className="rounded-lg border p-6"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <p className="font-mono text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--waypoint)' }}>
            {mode === 'login' ? 'Welcome back' : 'Get started'}
          </p>
          <h1 className="font-display text-2xl mb-6" style={{ color: 'var(--ink)' }}>
            {mode === 'login' ? 'Log in' : 'Create your account'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--muted)' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--border)' }}
              />
            </div>

            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--muted)' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--border)' }}
              />
            </div>

            {error && <p className="text-sm" style={{ color: '#B4432E' }}>{error}</p>}

            <button
              type="submit"
              className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: 'var(--trail)' }}
            >
              {mode === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          </form>

          <p className="text-sm text-center mt-5" style={{ color: 'var(--muted)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="underline hover:no-underline"
              style={{ color: 'var(--trail)' }}
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </main>
  )
}