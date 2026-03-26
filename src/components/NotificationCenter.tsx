import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Info, Zap, Trophy, Clock } from 'lucide-react';
import { AppNotification } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onClear: () => void;
  onMarkRead: (id: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onClear,
  onMarkRead
}) => {
  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'goal': return <Zap className="text-yellow-500" size={18} />;
      case 'news': return <Info className="text-blue-500" size={18} />;
      case 'system': return <Trophy className="text-red-500" size={18} />;
      default: return <Bell className="text-slate-400" size={18} />;
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm"
      />
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        className="fixed right-0 top-0 h-full w-full max-w-sm z-[101] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col"
      >
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell size={24} className="text-red-600" />
                  {notifications.some(n => !n.read) && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-950"></span>
                  )}
                </div>
                <h2 className="text-xl font-black tracking-tight uppercase">Notifications</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-600">
                    <Bell size={32} />
                  </div>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => onMarkRead(notification.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                      notification.read 
                        ? 'bg-slate-900/50 border-slate-800' 
                        : 'bg-slate-800 border-red-500/30 shadow-lg shadow-red-600/5'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="mt-1">{getIcon(notification.type)}</div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className={`font-bold text-sm ${notification.read ? 'text-slate-300' : 'text-white'}`}>
                            {notification.title}
                          </h3>
                          {!notification.read && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{notification.message}</p>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 uppercase tracking-widest pt-2">
                          <Clock size={10} />
                          {formatDistanceToNow(notification.timestamp)} ago
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-6 border-t border-slate-800 bg-slate-950">
                <button
                  onClick={onClear}
                  className="w-full bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                >
                  Clear All Notifications
                </button>
              </div>
            )}
          </motion.div>
        </>
  );
};
