import { useState } from 'react';
import { api } from '../lib/api.ts';
import { User } from '../types.ts';
import { motion } from 'motion/react';
import { KeyRound, Mail, UserPlus, LogIn, Sparkles, BookOpen, UserCheck } from 'lucide-react';

interface LoginScreenProps {
  onAuthSuccess: (user: User, token: string) => void;
}

export default function LoginScreen({ onAuthSuccess }: LoginScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'teacher' | 'admin'>('teacher');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Prefill helper - instant access for evaluation
  const handlePrefillDemo = async () => {
    setName('Prof. Lokesh');
    setEmail('lokesh@school.edu');
    setPassword('demo1234');
    setIsRegister(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const response = await api.auth.register({ name, email, password, role });
        localStorage.setItem('smart_attendance_auth_token', response.token);
        onAuthSuccess(response.user, response.token);
      } else {
        const response = await api.auth.login({ email, password });
        localStorage.setItem('smart_attendance_auth_token', response.token);
        onAuthSuccess(response.user, response.token);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-8 select-none">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-100"
      >
        {/* Decorative Top Accent Banner */}
        <div className="relative bg-slate-900 px-6 py-8 text-center text-white">
          <div className="absolute top-2 right-2 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-mono tracking-tight text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            Server Live
          </div>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 border border-slate-700/50">
            <BookOpen className="h-6 w-6 text-indigo-400" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">SmartGuard Command</h1>
          <p className="mt-1.5 text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
            AI-Powered classroom registry, automated rosters, and pattern analytics.
          </p>
        </div>

        {/* Outer Form Box */}
        <div className="p-6">
          {error && (
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-xs font-medium text-red-700 flex gap-2 items-center"
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 shrink-0"></span>
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserCheck className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Prof. Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 transition focus:border-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Academic Email Address
              </label>
              <div className="relative">
                <Mail className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="teacher@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 transition focus:border-slate-800 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 transition focus:border-slate-800 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Academic Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`rounded-lg py-2 text-xs font-medium border transition ${
                      role === 'teacher'
                        ? 'border-slate-800 bg-slate-900 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Teacher / Professor
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`rounded-lg py-2 text-xs font-medium border transition ${
                      role === 'admin'
                        ? 'border-slate-800 bg-slate-900 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Dean / Registrar
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 py-3 text-sm font-semibold text-white tracking-wide shadow-md shadow-indigo-100/45 transition duration-150 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : isRegister ? (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Create Account & Start</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Authenticate & Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Prompt options */}
          <div className="mt-5 text-center text-xs text-slate-500">
            {isRegister ? (
              <p>
                Already have an instructor profile?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setError(null);
                  }}
                  className="font-semibold text-slate-900 underline hover:text-indigo-600"
                >
                  Log in
                </button>
              </p>
            ) : (
              <p>
                First time registering classes?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setError(null);
                  }}
                  className="font-semibold text-slate-900 underline hover:text-indigo-600"
                >
                  Create an account
                </button>
              </p>
            )}
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4 text-center">
            <button
              type="button"
              onClick={handlePrefillDemo}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200/60"
            >
              <Sparkles className="h-3 w-3 text-indigo-500" />
              <span>Prefill Demo Roster credentials</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
