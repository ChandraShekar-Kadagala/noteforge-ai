import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sparkles, Sun, Moon, LogOut, FileText, User } from 'lucide-react';

interface NavbarProps {
  currentDocumentTitle?: string;
  saveStatus?: 'saved' | 'saving' | 'unsaved';
  onBackToDashboard?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDocumentTitle,
  saveStatus,
  onBackToDashboard,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Brand & Doc Title */}
        <div className="flex items-center space-x-3">
          <div
            onClick={onBackToDashboard}
            className="flex items-center space-x-2 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
              NoteForge <span className="text-brand-600 dark:text-brand-400">AI</span>
            </span>
          </div>

          {currentDocumentTitle && (
            <div className="hidden md:flex items-center space-x-2 pl-4 border-l border-slate-200 dark:border-slate-800">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 max-w-xs truncate">
                {currentDocumentTitle}
              </span>
              {saveStatus && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    saveStatus === 'saved'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : saveStatus === 'saving'
                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 animate-pulse'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions & User */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {user ? (
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name || user.email}
                    className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-slate-700">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                  </div>
                )}
                <span className="hidden sm:inline-block text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
                  {user.full_name || user.email.split('@')[0]}
                </span>
              </div>

              <button
                onClick={logout}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
