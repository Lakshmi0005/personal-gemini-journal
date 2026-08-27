import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  KeyRound, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  Cpu, 
  Server, 
  Layers,
  BrainCircuit,
  Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LandingView: React.FC = () => {
  const { 
    signInWithGoogle, 
    loginWithEmail, 
    signupWithEmail, 
    loginAsGuest, 
    error, 
    clearError 
  } = useAuth();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setFormError('Please provide both email and password');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      clearError();
      if (authMode === 'signin') {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password);
      }
    } catch (err: any) {
      setFormError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      setFormError(null);
      clearError();
      await signInWithGoogle();
    } catch (err: any) {
      setFormError(err.message || 'Google sign-in was cancelled');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setIsSubmitting(true);
      setFormError(null);
      clearError();
      await loginAsGuest();
    } catch (err: any) {
      setFormError(err.message || 'Guest sign-in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Mission, Value & Security Architecture */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Gen AI Academy APAC Ideathon Submission</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              A private, authenticated space for your deepest thoughts.
            </h1>

            <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">
              Personal Gemini Journal pairs advanced multi-turn conversational AI with 
              a <span className="text-indigo-300 font-semibold">strict zero-knowledge server-side security boundary</span>. 
              Reflect, brainstorm, make decisions, and receive automated synthesis without compromising your privacy.
            </p>

            {/* Security Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Cryptographic Isolation</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Firestore security rules enforce strict per-user paths (`/users/{'{uid}'}/...`). No cross-user access.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Server-Side Secret Boundary</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Gemini API keys stay on protected Node.js runtime. Zero client-side key exposure.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Multi-Turn AI Dialogue</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Context-aware journaling modes with empathetic guidance and iterative clarity.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Automated Summaries</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Instant structured synthesis with key themes, mood shift, and concrete next actions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Card */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

              {/* Form Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/30 mb-3">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  {authMode === 'signin' ? 'Sign in to your Journal' : 'Create your Secure Account'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Protected by Firebase Auth & Token Verification
                </p>
              </div>

              {/* Error Banner */}
              {(formError || error) && (
                <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <span className="font-semibold">Error:</span> {formError || error}
                </div>
              )}

              {/* Quick Google Sign In */}
              <button
                id="btn-google-signin"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-medium text-sm transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 cursor-pointer mb-4"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-2 text-slate-500 font-medium">Or continue with email</span>
                </div>
              </div>

              {/* Email / Password Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                  <input
                    id="input-auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                  <input
                    id="input-auth-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>

                <button
                  id="btn-auth-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-sm shadow-md shadow-indigo-600/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Mode Toggle & Guest Option */}
              <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-2.5 text-center text-xs">
                {authMode === 'signin' ? (
                  <p className="text-slate-400">
                    Don't have an account yet?{' '}
                    <button
                      id="btn-toggle-to-signup"
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        setFormError(null);
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                    >
                      Sign up free
                    </button>
                  </p>
                ) : (
                  <p className="text-slate-400">
                    Already registered?{' '}
                    <button
                      id="btn-toggle-to-signin"
                      type="button"
                      onClick={() => {
                        setAuthMode('signin');
                        setFormError(null);
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                    >
                      Sign in
                    </button>
                  </p>
                )}

                <div className="text-slate-500">
                  <span>Want to test quickly? </span>
                  <button
                    id="btn-guest-signin"
                    type="button"
                    onClick={handleGuestSignIn}
                    disabled={isSubmitting}
                    className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2 cursor-pointer"
                  >
                    Continue as Anonymous Guest
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Architecture Compliance Bar */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Zero-Knowledge Server Gateway Active</span>
          </div>
          <div>
            Built with React, Express, Firebase Authentication &amp; Cloud Firestore, and Gemini 2.5 on Cloud Run.
          </div>
        </div>
      </footer>
    </div>
  );
};
