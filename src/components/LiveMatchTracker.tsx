import React, { useMemo } from 'react';
import { Match, MatchEvent } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Shield, Target, Activity, AlertTriangle, Repeat, User } from 'lucide-react';

interface LiveMatchTrackerProps {
  match: Match;
}

export const LiveMatchTracker: React.FC<LiveMatchTrackerProps> = ({ match }) => {
  // Get the 5 most recent events
  const recentEvents = useMemo(() => {
    if (!match.events) return [];
    return [...match.events].sort((a, b) => b.time.elapsed - a.time.elapsed).slice(0, 5);
  }, [match.events]);

  const latestEvent = recentEvents[0];
  
  // Logic to determine ball position and action
  const isHomeAttacking = useMemo(() => {
    if (!latestEvent) return Math.random() > 0.5;
    return latestEvent.team.id === match.home_team.id;
  }, [latestEvent, match.home_team.id]);

  const actionType = latestEvent?.type || 'Attack';

  // Map event types to pitch positions (percentages)
  const getEventPosition = (event: MatchEvent) => {
    const isHome = event.team.id === match.home_team.id;
    // Goals are at the ends
    if (event.type === 'Goal') return isHome ? { left: '90%', top: '50%' } : { left: '10%', top: '50%' };
    // Cards/Subs are often near the middle or random
    if (event.type === 'Card') return { left: `${30 + Math.random() * 40}%`, top: `${20 + Math.random() * 60}%` };
    if (event.type === 'subst') return { left: '50%', top: Math.random() > 0.5 ? '5%' : '95%' };
    // Default random but biased towards attacking half
    return { 
      left: isHome ? `${60 + Math.random() * 30}%` : `${10 + Math.random() * 30}%`, 
      top: `${20 + Math.random() * 60}%` 
    };
  };

  return (
    <div className="relative w-full aspect-[16/9] bg-emerald-900 rounded-2xl overflow-hidden border-4 border-emerald-800 shadow-2xl group">
      {/* Pitch Graphics (SVG for better precision) */}
      <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 100 60">
        <defs>
          <pattern id="grass-stripes" x="0" y="0" width="10" height="60" patternUnits="userSpaceOnUse">
            <rect width="5" height="60" fill="rgba(255,255,255,0.04)" />
            <rect x="5" width="5" height="60" fill="rgba(0,0,0,0.04)" />
          </pattern>
          <pattern id="grass-grid" x="0" y="0" width="100" height="10" patternUnits="userSpaceOnUse">
            <rect width="100" height="5" fill="rgba(255,255,255,0.02)" />
            <rect y="5" width="100" height="5" fill="transparent" />
          </pattern>
          <radialGradient id="pitch-glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.3)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <rect width="100" height="60" fill="url(#grass-stripes)" />
        <rect width="100" height="60" fill="url(#grass-grid)" />
        <rect width="100" height="60" fill="url(#pitch-glow)" />
        
        {/* Outer Line */}
        <rect x="2" y="2" width="96" height="56" fill="none" stroke="white" strokeWidth="0.4" />
        {/* Halfway Line */}
        <line x1="50" y1="2" x2="50" y2="58" stroke="white" strokeWidth="0.4" />
        {/* Center Circle */}
        <circle cx="50" cy="30" r="8" fill="none" stroke="white" strokeWidth="0.4" />
        <circle cx="50" cy="30" r="0.5" fill="white" />
        {/* Penalty Areas */}
        <rect x="2" y="15" width="12" height="30" fill="none" stroke="white" strokeWidth="0.4" />
        <rect x="86" y="15" width="12" height="30" fill="none" stroke="white" strokeWidth="0.4" />
        {/* Goal Areas */}
        <rect x="2" y="22" width="5" height="16" fill="none" stroke="white" strokeWidth="0.4" />
        <rect x="93" y="22" width="5" height="16" fill="none" stroke="white" strokeWidth="0.4" />
        {/* Goal Nets (Stylized) */}
        <path d="M 0 22 L 2 22 L 2 38 L 0 38" fill="none" stroke="white" strokeWidth="0.2" strokeDasharray="0.5,0.5" />
        <path d="M 100 22 L 98 22 L 98 38 L 100 38" fill="none" stroke="white" strokeWidth="0.2" strokeDasharray="0.5,0.5" />
        {/* Corners */}
        <path d="M 2 5 L 5 2" fill="none" stroke="white" strokeWidth="0.3" />
        <path d="M 95 2 L 98 5" fill="none" stroke="white" strokeWidth="0.3" />
        <path d="M 2 55 L 5 58" fill="none" stroke="white" strokeWidth="0.3" />
        <path d="M 95 58 L 98 55" fill="none" stroke="white" strokeWidth="0.3" />
        {/* Penalty Spots */}
        <circle cx="10" cy="30" r="0.3" fill="white" />
        <circle cx="90" cy="30" r="0.3" fill="white" />
      </svg>

      {/* Player Markers (Simulated) */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(11)].map((_, i) => (
          <motion.div
            key={`home-${i}`}
            animate={{ 
              left: [`${10 + Math.random() * 80}%`, `${10 + Math.random() * 80}%`],
              top: [`${5 + Math.random() * 90}%`, `${5 + Math.random() * 90}%`]
            }}
            transition={{ duration: 8 + Math.random() * 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-2 h-2 bg-red-600 rounded-full border border-white/40 shadow-[0_0_5px_rgba(220,38,38,0.5)] z-10"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[6px] font-black text-white/50 opacity-0 group-hover:opacity-100 transition-opacity">H{i+1}</div>
          </motion.div>
        ))}
        {[...Array(11)].map((_, i) => (
          <motion.div
            key={`away-${i}`}
            animate={{ 
              left: [`${10 + Math.random() * 80}%`, `${10 + Math.random() * 80}%`],
              top: [`${5 + Math.random() * 90}%`, `${5 + Math.random() * 90}%`]
            }}
            transition={{ duration: 8 + Math.random() * 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-2 h-2 bg-blue-600 rounded-full border border-white/40 shadow-[0_0_5px_rgba(37,99,235,0.5)] z-10"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[6px] font-black text-white/50 opacity-0 group-hover:opacity-100 transition-opacity">A{i+1}</div>
          </motion.div>
        ))}
      </div>

      {/* Dynamic Event Markers */}
      <AnimatePresence>
        {match.events?.slice(-3).map((event) => {
          const pos = getEventPosition(event);
          return (
            <motion.div
              key={event.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              style={{ left: pos.left, top: pos.top }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
            >
              <div className={`p-1.5 rounded-full shadow-lg border-2 border-white/50 ${
                event.type === 'Goal' ? 'bg-emerald-500' : 
                event.type === 'Card' ? 'bg-yellow-500' : 'bg-blue-500'
              }`}>
                {event.type === 'Goal' ? <Zap size={12} className="text-white" /> :
                 event.type === 'Card' ? <AlertTriangle size={12} className="text-black" /> :
                 <Repeat size={12} className="text-white" />}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Active Ball Action */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-full h-full">
          <motion.div
            animate={{ 
              left: isHomeAttacking ? ['45%', '75%', '65%'] : ['55%', '25%', '35%'],
              top: ['50%', '30%', '50%', '70%', '50%'],
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-2xl border border-slate-300"
              >
                <div className="w-4 h-4 border border-slate-100 rounded-full flex items-center justify-center overflow-hidden">
                  <div className="grid grid-cols-2 grid-rows-2 w-full h-full opacity-20">
                    <div className="bg-black"></div>
                    <div></div>
                    <div></div>
                    <div className="bg-black"></div>
                  </div>
                </div>
              </motion.div>
              {/* Ball Shadow */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/40 blur-[2px] rounded-full"></div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Action Banner */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={latestEvent?.id || 'idle'}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="bg-black/80 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 flex items-center gap-3 shadow-2xl"
          >
            {actionType === 'Goal' ? (
              <Zap size={16} className="text-yellow-400 animate-pulse" />
            ) : isHomeAttacking ? (
              <Target size={16} className="text-red-500" />
            ) : (
              <Shield size={16} className="text-blue-500" />
            )}
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                {actionType === 'Goal' ? 'GOAL SCORED!' : isHomeAttacking ? `${match.home_team.name} Attacking` : `${match.away_team.name} Attacking`}
              </span>
              {latestEvent && (
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                  {latestEvent.time.elapsed}' - {latestEvent.player.name}
                </span>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Live Feed Sidebar (Mini) */}
      <div className="absolute top-4 right-4 bottom-4 w-32 hidden md:flex flex-col gap-2 overflow-hidden">
        <div className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Live Feed</div>
        <AnimatePresence>
          {recentEvents.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-black/40 backdrop-blur-sm p-2 rounded-lg border border-white/5 flex items-center gap-2"
            >
              <div className={`w-1 h-full rounded-full ${
                event.type === 'Goal' ? 'bg-emerald-500' : 
                event.type === 'Card' ? 'bg-yellow-500' : 'bg-blue-500'
              }`}></div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-black text-white truncate">{event.player.name}</span>
                <span className="text-[7px] font-bold text-slate-500">{event.time.elapsed}' - {event.type}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bottom Stats Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-8">
        <div className="flex items-end justify-between">
          <div className="flex gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <img src={`https://api.sofascore.app/api/v1/team/${match.home_team.id}/image`} className="w-4 h-4 object-contain" referrerPolicy="no-referrer" alt="" />
                <span className="text-[10px] font-black text-white uppercase">{match.home_team.name}</span>
              </div>
              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '54%' }}
                  className="h-full bg-red-600"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <img src={`https://api.sofascore.app/api/v1/team/${match.away_team.id}/image`} className="w-4 h-4 object-contain" referrerPolicy="no-referrer" alt="" />
                <span className="text-[10px] font-black text-white uppercase">{match.away_team.name}</span>
              </div>
              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '46%' }}
                  className="h-full bg-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Match Intensity</span>
              <div className="flex gap-0.5 h-3 items-end">
                {[4, 7, 5, 9, 6, 8, 4, 10, 7, 5].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [`${h * 10}%`, `${(h + (Math.random() * 4 - 2)) * 10}%`, `${h * 10}%`] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                    className="w-1 bg-emerald-500 rounded-t-sm"
                  />
                ))}
              </div>
            </div>
            <div className="bg-red-600 text-white px-2 py-1 rounded flex items-center gap-1.5">
              <Activity size={10} className="animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-widest">Live</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
