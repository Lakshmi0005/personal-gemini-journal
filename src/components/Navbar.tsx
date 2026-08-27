import React from 'react';
import { 
  Shield, 
  Lock, 
  Sparkles, 
  BookOpen, 
  History, 
  LogOut, 
  User as UserIcon, 
  Activity,
  PlusCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  currentTab: 'dashboard' | 'chat' | 'history' | 'summary-detail';
  setCurrentTab: (tab: 'dashboard' | 'chat' | 'history') => void;
  onNewSession: () => void;
  onOpenSecurityAudit: () => void;
  hasActiveChat: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onNewSession,
  onOpenSecurityAudit,
  hasActiveChat,
}) => {
  const { user, userProfile, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">
                  Personal Gemini Journal
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  APAC Ideathon
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal">
                Private &bull; Zero-Leakage &bull; Authenticated
              </p>
            </div>
          </div>

          {/* Navigation Links for Authenticated Users */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
              <button
                id="nav-btn-dashboard"
                onClick={() => setCurrentTab('dashboard')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Dashboard
              </button>

              {hasActiveChat && (
                <button
                  id="nav-btn-chat"
                  onClick={() => setCurrentTab('chat')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    currentTab === 'chat'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  Active Journal
                </button>
              )}

              <button
                id="nav-btn-history"
                onClick={() => setCurrentTab('history')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'history'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <History className="w-4 h-4" />
                History & Summaries
              </button>
            </nav>
          )}

          {/* Action Buttons & User Menu */}
          <div className="flex items-center gap-3">
            {user && (
              <>
                <button
                  id="btn-nav-new-journal"
                  onClick={onNewSession}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  New Session
                </button>

                {/* Security Audit Trigger */}
                <button
                  id="btn-open-security-audit"
                  onClick={onOpenSecurityAudit}
                  title="View Security & Trust Diagnostics"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 text-xs font-medium rounded-lg transition-all cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Zero-Trust Protected</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                </button>

                {/* User Dropdown / Sign Out */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
                  <div className="flex items-center gap-2" title={user.email || 'Authenticated User'}>
                    <div className="w-8 h-8 rounded-full bg-indigo-900/80 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-200 overflow-hidden">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt="User avatar" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <UserIcon className="w-4 h-4 text-indigo-300" />
                      )}
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-xs font-medium text-slate-200 truncate max-w-[120px]">
                        {userProfile?.displayName}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                        {user.isAnonymous ? 'Guest Account' : user.email}
                      </p>
                    </div>
                  </div>

                  <button
                    id="btn-sign-out"
                    onClick={logout}
                    title="Sign Out"
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
