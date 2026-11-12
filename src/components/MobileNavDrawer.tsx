import React, { useEffect } from 'react';
import { User } from 'firebase/auth';
import { NavTab } from './Header';
import {
  Calendar,
  BookOpen,
  Sliders,
  BarChart2,
  X,
  LogIn,
  LogOut,
  CheckCircle2,
  Plus,
  Play,
  Sparkles,
} from 'lucide-react';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  dueSubjectsCount: number;
  user: User | null;
  onSignInWithGoogle: () => void;
  onSignOut: () => void;
  onQuickLogRevision?: () => void;
  onQuickAddSubject?: () => void;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  dueSubjectsCount,
  user,
  onSignInWithGoogle,
  onSignOut,
  onQuickLogRevision,
  onQuickAddSubject,
}) => {
  // Prevent background body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    {
      id: 'calendar',
      label: 'Revision Calendar',
      icon: Calendar,
      badge: dueSubjectsCount > 0 ? `${dueSubjectsCount} due` : undefined,
    },
    {
      id: 'subjects',
      label: 'Subjects & Categories',
      icon: BookOpen,
    },
    {
      id: 'schedules',
      label: 'Revision Schedules',
      icon: Sliders,
    },
    {
      id: 'analytics',
      label: 'AI Statistics',
      icon: BarChart2,
    },
  ];

  return (
    <div
      className={`fixed inset-0 z-[100] transition-opacity duration-300 md:hidden ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop scrim */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel (Solid Opaque Surface) */}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-[85vw] max-w-sm bg-[#0f172a] border-l border-slate-800 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-out z-[101] overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#090d16]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 rotate-45 inline-block" aria-hidden="true" />
              <span className="text-base font-bold tracking-tight text-white">Lucidia</span>
            </div>

            <button
              onClick={onClose}
              aria-label="Close menu"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg active:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Account Status Card */}
          <div className="p-4 border-b border-slate-800 bg-[#0b1120]">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full border border-slate-700 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white truncate">
                      {user.displayName || user.email?.split('@')[0]}
                    </div>
                    <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      <span>Cloud Synced</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onSignOut();
                    onClose();
                  }}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-slate-400">
                  Sign in to automatically sync your revision schedules and stats across all your devices.
                </div>
                <button
                  onClick={() => {
                    onSignInWithGoogle();
                    onClose();
                  }}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl shadow-sm transition-all active:scale-[0.98]"
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
                  <span>Sign in with Google</span>
                </button>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-slate-500 uppercase font-mono">
              Navigation
            </div>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    onClose();
                  }}
                  className={`w-full min-h-[48px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60 active:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono font-medium">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Actions at Bottom of Drawer */}
        <div className="p-4 border-t border-slate-800 bg-[#090d16] space-y-2.5">
          <div className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase font-mono px-1">
            Quick Actions
          </div>

          {onQuickLogRevision && (
            <button
              onClick={() => {
                onQuickLogRevision();
                onClose();
              }}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Log Due Revision</span>
            </button>
          )}

          {onQuickAddSubject && (
            <button
              onClick={() => {
                onQuickAddSubject();
                onClose();
              }}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Subject</span>
            </button>
          )}

          <div className="text-[11px] text-slate-500 text-center pt-1 font-mono">
            Lucidia Spaced Repetition
          </div>
        </div>
      </aside>
    </div>
  );
};
