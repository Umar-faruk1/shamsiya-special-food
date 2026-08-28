'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { signInAdmin } from '@/lib/supabase/auth'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    try {
      if (!email || !password) {
        throw new Error('Enter your email and password to continue.')
      }

      await signInAdmin(email, password)
      document.cookie = 'shamsiya_session=authenticated; path=/; max-age=86400; SameSite=Lax'
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Unable to sign in.')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void handleLogin()
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel" aria-label="Shamsiya Special Food">
        <Link href="/" className="login-brand">
          <span className="brand-mark" aria-hidden="true">S<i /></span>
          <span><strong>Shamsiya</strong><small>Special Food</small></span>
        </Link>
        <div className="login-brand-copy">
          <span className="eyebrow">Operations, beautifully organized</span>
          <h1>Welcome back to your kitchen.</h1>
          <p>Keep every order, rider, and customer moving with one calm command center.</p>
        </div>
        <div className="login-trust"><ShieldCheck aria-hidden="true" /><span>Private workspace for Shamsiya teams</span></div>
      </section>

      <section className="login-form-panel">
        <div className="login-form-wrap">
          <div className="login-mobile-brand"><span className="brand-mark" aria-hidden="true">S<i /></span><span><strong>Shamsiya</strong><small>Special Food</small></span></div>
          <span className="eyebrow">Admin portal</span>
          <h2>Sign in</h2>
          <p className="login-subtitle">Use your team credentials to access the dashboard.</p>
          <form onSubmit={handleSubmit} className="login-form">
            <label htmlFor="email">Email address</label>
            <div className="login-input-wrap"><Mail aria-hidden="true" /><input id="email" type="email" autoComplete="email" placeholder="you@shamsiya.com" value={email} onChange={event => setEmail(event.target.value)} /></div>
            <div className="login-label-row"><label htmlFor="password">Password</label></div>
            <div className="login-input-wrap"><LockKeyhole aria-hidden="true" /><input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={event => setPassword(event.target.value)} /><button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button></div>
            <div className="login-options"><label className="remember-option"><input type="checkbox" /> <span>Remember me</span></label></div>
            <button type="submit" className="primary-button login-submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'} {!loading && <ArrowRight aria-hidden="true" />}</button>
            {error && <p className="login-message" role="alert">{error}</p>}
          </form>
          <p className="login-footer">Need access? <button type="button" className="login-link">Contact your administrator</button></p>
        </div>
      </section>
    </main>
  )
}
