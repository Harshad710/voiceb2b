'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Package2, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminLoginPage() {
  const router = useRouter();
  const [phone, setPhone]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPwd, setShowPwd]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        // Backend returned 401 — wrong credentials
        setError(json.message ?? 'Invalid phone number or password.');
        return;
      }

      // ── Role check — UI-level guard ──────────────────────────────────────
      // The REAL enforcement is authMiddleware + isAdmin on backend routes.
      // This check prevents a retailer from accidentally landing in the
      // admin dashboard with a valid (but wrong-role) token.
      if (json.data?.role !== 'ADMIN') {
        setError('This login is for distributor admins only. Please use the retailer app.');
        return; // token is intentionally discarded — NOT stored
      }

      // Credentials valid + role confirmed ADMIN — store and redirect
      localStorage.setItem('admin_token', json.token);
      router.push('/admin/orders');
    } catch {
      setError('Could not reach the server. Is it running on port 5000?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080e1e] flex items-center justify-center p-4">
      {/* ── Card ─────────────────────────────────────────────────────────── */}
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/30 mb-4">
            <Package2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">VoiceB2B</h1>
          <p className="text-sm text-slate-400 mt-1">Distributor Admin Portal</p>
        </div>

        {/* Form card */}
        <div className="bg-slate-900/60 backdrop-blur border border-slate-800/60 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-6">Sign in to your account</h2>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-400 leading-snug">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Phone */}
            <div className="space-y-1.5">
              <label htmlFor="admin-phone" className="block text-sm font-medium text-slate-300">
                Phone number
              </label>
              <input
                id="admin-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                required
                autoComplete="tel"
                className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/40 transition"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your admin password"
                  required
                  autoComplete="current-password"
                  className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-4 py-2.5 pr-11 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/40 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="admin-login-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg py-2.5 transition-colors shadow-lg shadow-indigo-500/25"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-700 mt-6">
          Retailer? Use the VoiceB2B mobile app to place orders.
        </p>
      </div>
    </div>
  );
}
