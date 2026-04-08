import React from 'react';
import { RefreshCw, Moon, Sun, Youtube, User, Bell, LogIn, Clock } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
  isDarkMode: boolean;
  toggleTheme: () => void;
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
  onLtbChannelClick: (url?: string) => void;
  profile: UserProfile;
  isLoggedIn: boolean;
  onOpenLogin: () => void;
  unreadCount: number;
  currentSection: 'highlights' | 'community' | 'ltb-tv' | 'live-scores';
  onSectionChange: (section: 'highlights' | 'community' | 'ltb-tv' | 'live-scores') => void;
  pendingCount: number;
  isScoutMode: boolean;
  toggleScoutMode: () => void;
  isGoalFlash?: boolean;
  lastUpdated: Date;
}

export const Header: React.FC<HeaderProps> = ({ 
  onRefresh, 
  isRefreshing = false,
  isDarkMode, 
  toggleTheme,
  onOpenProfile,
  onOpenLogin,
  onOpenNotifications,
  onLtbChannelClick,
  profile,
  isLoggedIn,
  unreadCount,
  currentSection,
  onSectionChange,
  pendingCount,
  isScoutMode,
  toggleScoutMode,
  isGoalFlash,
  lastUpdated
}) => {
  return (
    <header className={`p-4 shadow-lg border-b transition-all duration-500 relative z-50 ${
      isGoalFlash 
        ? 'bg-green-500 text-black border-green-400 animate-goal-flash' 
        : 'bg-slate-900 text-white border-slate-800'
    }`}>
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Top Row: Logo & User Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-red-600 p-2 rounded-full animate-pulse">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight whitespace-nowrap">LTB SPORTS</h1>
              <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-slate-500">
                <Clock size={8} />
                Last Update: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 shrink-0 ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Refresh"
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={onOpenNotifications}
              className="relative p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 shrink-0"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-[10px] font-black flex items-center justify-center rounded-full border-2 border-slate-900 shadow-lg">
                  {unreadCount}
                </span>
              )}
            </button>

            {isLoggedIn ? (
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 p-1 md:px-3 md:py-1.5 rounded-xl transition-colors border border-slate-700 group shrink-0"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-600 group-hover:border-red-500 transition-colors">
                  <img 
                    src={profile.profilePic || `https://picsum.photos/seed/${profile.username}/100/100`} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs font-bold hidden md:inline">{profile.username}</span>
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-red-600/20 active:scale-95 shrink-0 text-white"
              >
                <LogIn size={16} />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 shrink-0"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        {/* Bottom Row: Navigation & Secondary Actions */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800/50 md:border-0 md:pt-0">
          <nav className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 overflow-x-auto scrollbar-hide w-full md:w-auto">
            <button
              onClick={() => onSectionChange('live-scores')}
              className={`px-4 md:px-6 py-2 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
                currentSection === 'live-scores' 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              LIVE SCORES
            </button>
            <button
              onClick={() => onSectionChange('highlights')}
              className={`px-4 md:px-6 py-2 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
                currentSection === 'highlights' 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              HIGHLIGHTS
            </button>
            <button
              onClick={() => onSectionChange('ltb-tv')}
              className={`px-4 md:px-6 py-2 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
                currentSection === 'ltb-tv' 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              LTB Live TV
            </button>
            <button
              onClick={() => onSectionChange('community')}
              className={`px-4 md:px-6 py-2 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
                currentSection === 'community' 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Community
            </button>
          </nav>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto scrollbar-hide justify-end">
            {/* Removed extra buttons as requested */}
          </div>
        </div>
      </div>
    </header>
  );
};
