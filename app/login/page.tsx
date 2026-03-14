'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/dashboard';

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Invalid credentials');
        return;
      }
      router.push(from);
      router.refresh();
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4"
      style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm space-y-6">

        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white mx-auto"
            style={{ background: '#E63946' }}>
            CT
          </div>
          <h1 className="text-2xl font-bold"
            style={{ color: 'var(--text)', fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>
            Crazy Tadka
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Office Portal — Bold Flavours. Crazy Good.</p>
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit}
          className="rounded-xl border p-6 space-y-4"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>

          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
              Email
            </label>
            <input
              type="email" required autoFocus
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@crazytadka.in"
              className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none transition-colors"
              style={{ background: 'transparent', color: 'var(--text)', borderColor: 'var(--card-border)' }}
              onFocus={e => (e.target.style.borderColor = '#E63946')}
              onBlur={e => (e.target.style.borderColor = 'var(--card-border)')}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
              Password
            </label>
            <input
              type="password" required
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none transition-colors"
              style={{ background: 'transparent', color: 'var(--text)', borderColor: 'var(--card-border)' }}
              onFocus={e => (e.target.style.borderColor = '#E63946')}
              onBlur={e => (e.target.style.borderColor = 'var(--card-border)')}
            />
          </div>

          {error && (
            <div className="rounded-lg px-3 py-2 text-sm text-red-400"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
            style={{ background: '#E63946' }}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs" style={{ color: 'var(--muted)' }}>
          Internal staff access only.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-sm" style={{ color: 'var(--muted)' }}>Loading…</div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
