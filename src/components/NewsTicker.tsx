import React from 'react';
import { motion } from 'motion/react';
import { Match } from '../types';

interface NewsTickerProps {
  matches?: Match[];
  isGoalFlash?: boolean;
}

const newsItems = [
  "⚽ Transfer Talk: Mbappe settles into life in Madrid...",
  "🔥 Super Eagles gear up for next World Cup Qualifier...",
  "🏆 Premier League: Title race heats up as top three all win...",
  "💰 Record Breaking: LTB Sports partners with new global sponsors...",
  "🏟️ Stadium News: Old Trafford renovation plans approved...",
  "⭐ Transfer Rumor: Manchester City eyeing young Nigerian star..."
];

export const NewsTicker: React.FC<NewsTickerProps> = ({ matches = [], isGoalFlash = false }) => {
  const tickerContent = matches.length > 0 
    ? matches.map(m => `● ${m.home_team.name} ${m.home_score.current}-${m.away_score.current} ${m.away_team.name}`).join("     ")
    : newsItems.join("     ");

  return (
    <div className={`h-12 overflow-hidden flex items-center shadow-2xl transition-all duration-500 border-b-2 border-red-600/50 z-[70] relative ${
      isGoalFlash ? 'bg-green-500 text-black' : 'bg-slate-950 text-white'
    }`}>
      <div className="bg-red-600 text-white px-6 h-full flex items-center font-black text-[11px] uppercase tracking-[0.25em] z-20 shadow-[10px_0_30px_rgba(220,38,38,0.3)] gap-2 rounded-r-full">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]"></span>
        {matches.length > 0 ? 'Live Scores' : 'Breaking'}
      </div>
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        <motion.div
          className="flex whitespace-nowrap gap-16"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: matches.length > 0 ? 25 : 45,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <div className="flex gap-16 pr-16 items-center">
            <span className="font-black text-sm uppercase tracking-wider flex items-center gap-4">
              {tickerContent}
            </span>
            <span className="font-black text-sm uppercase tracking-wider flex items-center gap-4">
              {tickerContent}
            </span>
            <span className="font-black text-sm uppercase tracking-wider flex items-center gap-4">
              {tickerContent}
            </span>
            <span className="font-black text-sm uppercase tracking-wider flex items-center gap-4">
              {tickerContent}
            </span>
          </div>
        </motion.div>
        
        {/* Gradient overlays for smooth fade */}
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none"></div>
      </div>
    </div>
  );
};
