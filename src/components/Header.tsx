import React from 'react';
import { User } from 'firebase/auth';
import { Calendar, BookOpen, Sliders, BarChart2, LogIn, LogOut, CheckCircle2, Menu, Trophy, Coins } from 'lucide-react';

export type NavTab = 'calendar' | 'subjects' | 'schedules' | 'analytics' | 'vault';

interface HeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  dueSubjectsCount: number;
  user: User | null;
  onSignInWithGoogle: () => void;
  onSignOut: () => void;
  isSyncing?: boolean;
  onOpenMobileNav: () => void;
  tokens?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  dueSubjectsCount,
  user,
  onSignInWithGoogle,
  onSignOut,
  isSyncing,
  onOpenMobileNav,
  tokens = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-2.5 sm:px-4 lg:px-6 py-2 sm:py-2.5 w-full max-w-full overflow-hidden">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2 md:gap-3 lg:gap-6">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <button
          onClick={() => onTabChange('calendar')}
          className="text-base sm:text-lg font-bold tracking-tight text-white hover:text-indigo-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <img
            src="/favicon.ico"
            alt="Lucidia icon"
            referrerPolicy="no-referrer"
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg object-cover border border-indigo-400/30 shadow-sm shrink-0"
          />
          <span>Lucidia</span>
        </button>

        {/* Zone 2: Navigation Links (Tablet & Desktop with Compact Labels on Tablet) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2.5 xl:gap-5 text-xs lg:text-sm font-medium text-slate-400">
          <button
            onClick={() => onTabChange('calendar')}
            className={`whitespace-nowrap shrink-0 transition-colors px-1.5 md:px-2 lg:px-2.5 py-1 relative flex items-center gap-1 lg:gap-1.5 ${
              activeTab === 'calendar' ? 'text-indigo-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            <span className="hidden xl:inline">Revision Calendar</span>
            <span className="inline xl:hidden">Calendar</span>
            {dueSubjectsCount > 0 && (
              <span className="text-[10px] lg:text-xs text-indigo-300/90 font-mono tabular-nums">
                ({dueSubjectsCount})
              </span>
            )}
            {activeTab === 'calendar' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => onTabChange('subjects')}
            className={`whitespace-nowrap shrink-0 transition-colors px-1.5 md:px-2 lg:px-2.5 py-1 relative flex items-center gap-1 lg:gap-1.5 ${
              activeTab === 'subjects' ? 'text-indigo-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            <span className="hidden xl:inline">Subjects & Categories</span>
            <span className="inline xl:hidden">Subjects</span>
            {activeTab === 'subjects' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => onTabChange('schedules')}
            className={`whitespace-nowrap shrink-0 transition-colors px-1.5 md:px-2 lg:px-2.5 py-1 relative flex items-center gap-1.5 ${
              activeTab === 'schedules' ? 'text-indigo-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            <span className="hidden xl:inline">Revision Schedules</span>
            <span className="inline xl:hidden">Schedules</span>
            {activeTab === 'schedules' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => onTabChange('analytics')}
            className={`whitespace-nowrap shrink-0 transition-colors px-1.5 md:px-2 lg:px-2.5 py-1 relative flex items-center gap-1 lg:gap-1.5 ${
              activeTab === 'analytics' ? 'text-indigo-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            <span className="hidden xl:inline">AI Statistics</span>
            <span className="inline xl:hidden">AI Stats</span>
            {activeTab === 'analytics' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>

          {/* 3D Trophy Vault Tab */}
          <button
            onClick={() => onTabChange('vault')}
            className={`whitespace-nowrap shrink-0 transition-colors px-1.5 md:px-2 lg:px-2.5 py-1 relative flex items-center gap-1 lg:gap-1.5 ${
              activeTab === 'vault' ? 'text-amber-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-amber-400" />
            <span className="hidden xl:inline">Trophy Vault</span>
            <span className="inline xl:hidden">Vault</span>
            {activeTab === 'vault' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
            )}
          </button>
        </nav>

        {/* Zone 3: Google Auth & Token Pill & Mobile Menu Trigger */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 shrink-0">
          {/* Synaptic Tokens Pill Button */}
          <button
            onClick={() => onTabChange('vault')}
            title="Open 3D Trophy Vault"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 lg:px-3 py-1 sm:py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold transition-all shadow-sm shrink-0"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{tokens}</span>
            <span className="hidden sm:inline font-sans font-medium text-[11px] text-amber-300/80">⚡</span>
          </button>
          {user ? (
            <div className="flex items-center gap-2 sm:gap-2.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 sm:px-3 py-1.5">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full border border-slate-700 object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}

              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-slate-200 max-w-[120px] truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>Cloud Synced</span>
                </div>
              </div>

              <button
                onClick={onSignOut}
                title="Sign out"
                className="hidden md:block p-1 text-slate-400 hover:text-rose-400 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignInWithGoogle}
              className="hidden sm:flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-850 border border-slate-700 rounded-xl shadow-sm transition-all whitespace-nowrap shrink-0 hover:border-indigo-500"
            >
              {/* Google G logo */}
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
              <span>Sign in</span>
            </button>
          )}

          {/* Mobile Hamburger Button */}
          <button
            onClick={onOpenMobileNav}
            aria-label="Open mobile navigation menu"
            className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 active:bg-slate-800 transition-colors relative"
          >
            <Menu className="w-5 h-5" />
            {dueSubjectsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 text-[10px] text-white font-bold flex items-center justify-center font-mono">
                {dueSubjectsCount > 9 ? '9+' : dueSubjectsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
