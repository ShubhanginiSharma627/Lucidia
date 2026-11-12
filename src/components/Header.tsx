import React from 'react';
import { User } from 'firebase/auth';
import { Calendar, BookOpen, Sliders, BarChart2, LogIn, LogOut, CheckCircle2 } from 'lucide-react';

export type NavTab = 'calendar' | 'subjects' | 'schedules' | 'analytics';

interface HeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  dueSubjectsCount: number;
  user: User | null;
  onSignInWithGoogle: () => void;
  onSignOut: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  dueSubjectsCount,
  user,
  onSignInWithGoogle,
  onSignOut,
  isSyncing,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <button
          onClick={() => onTabChange('calendar')}
          className="text-lg font-bold tracking-tight text-white hover:text-indigo-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 rotate-45 inline-block" aria-hidden="true" />
          <span>Lucidia</span>
        </button>

        {/* Zone 2: 4 Single-Line Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
          <button
            onClick={() => onTabChange('calendar')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 relative flex items-center gap-1.5 ${
              activeTab === 'calendar' ? 'text-indigo-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Revision Calendar</span>
            {dueSubjectsCount > 0 && (
              <span className="text-xs text-indigo-300/90 font-mono tabular-nums">
                ({dueSubjectsCount})
              </span>
            )}
            {activeTab === 'calendar' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => onTabChange('subjects')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 relative flex items-center gap-1.5 ${
              activeTab === 'subjects' ? 'text-indigo-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Subjects & Categories</span>
            {activeTab === 'subjects' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => onTabChange('schedules')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 relative flex items-center gap-1.5 ${
              activeTab === 'schedules' ? 'text-indigo-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Revision Schedules</span>
            {activeTab === 'schedules' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => onTabChange('analytics')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 relative flex items-center gap-1.5 ${
              activeTab === 'analytics' ? 'text-indigo-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>AI Statistics</span>
            {activeTab === 'analytics' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>
        </nav>

        {/* Zone 3: Google Auth & Cloud Sync Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
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
                className="p-1 text-slate-400 hover:text-rose-400 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignInWithGoogle}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-850 border border-slate-700 rounded-xl shadow-sm transition-all whitespace-nowrap shrink-0 hover:border-indigo-500"
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
              <span>Sign in with Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
