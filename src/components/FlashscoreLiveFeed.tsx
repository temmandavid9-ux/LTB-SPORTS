import React from 'react';
import { Match } from '../types';
import { Star } from 'lucide-react';

interface FlashscoreLiveFeedProps {
  matches: Match[];
  filter: 'all' | 'live' | 'finished';
  onFilterChange: (filter: 'all' | 'live' | 'finished') => void;
  onMatchClick?: (match: Match) => void;
}

export const FlashscoreLiveFeed: React.FC<FlashscoreLiveFeedProps> = ({ matches, filter, onFilterChange, onMatchClick }) => {
  const filteredMatches = matches.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'live') return m.status.type === 'inprogress';
    if (filter === 'finished') return m.status.type === 'finished';
    return true;
  });

  // Group matches by tournament
  const groupedMatches = filteredMatches.reduce((acc, match) => {
    const tournamentName = match.tournament.name;
    if (!acc[tournamentName]) {
      acc[tournamentName] = [];
    }
    acc[tournamentName].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  return (
    <div className="live-container rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-bg-dark">
      <div className="fs-tabs flex bg-black p-1.5 gap-1.5 border-b border-slate-800">
        <button 
          className={`tab-btn flex-1 py-2 px-4 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all ${filter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          onClick={() => onFilterChange('all')}
        >
          ALL
        </button>
        <button 
          className={`tab-btn flex-1 py-2 px-4 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${filter === 'live' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          onClick={() => onFilterChange('live')}
        >
          <span className="live-dot w-1.5 h-1.5 bg-live-red rounded-full animate-pulse"></span>
          MATCHES
        </button>
        <button 
          className={`tab-btn flex-1 py-2 px-4 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all ${filter === 'finished' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          onClick={() => onFilterChange('finished')}
        >
          FINISHED
        </button>
      </div>
      
      <div id="live-score-feed" className="bg-bg-dark divide-y divide-slate-900">
        {Object.keys(groupedMatches).length === 0 ? (
          <div className="p-12 text-center text-text-muted font-bold text-xs uppercase tracking-widest">
            No {filter} matches at the moment
          </div>
        ) : (
          Object.entries(groupedMatches).map(([tournamentName, tournamentMatches]) => (
            <div key={tournamentName} className="league-section">
              <div className="league-header bg-[#2d304a] px-4 py-2 flex items-center gap-3 border-b border-bg-dark">
                <div className="w-1.5 h-4 bg-red-600 rounded-full"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-text-main">
                  {tournamentName}
                </span>
              </div>
              
              <div className="divide-y divide-bg-dark">
                {tournamentMatches.map(match => (
                  <div 
                    key={match.id} 
                    onClick={() => onMatchClick?.(match)}
                    className="match-row flex items-center px-4 py-2 bg-row-dark hover:bg-slate-800 transition-colors cursor-pointer group border-b border-bg-dark last:border-0"
                  >
                    <div className="match-status w-10 text-[9px] font-black uppercase tracking-tighter text-text-muted group-hover:text-live-red transition-colors">
                      {match.status.type === 'inprogress' ? (
                        <span className="text-live-red animate-pulse">{match.status.description}'</span>
                      ) : (
                        match.status.description
                      )}
                    </div>
                    
                    <div className="teams-container flex-1 flex flex-col gap-0.5">
                      <div className="team flex justify-between items-center">
                        <span className={`team-name text-[11px] font-bold ${match.home_score.current > match.away_score.current && match.status.type === 'finished' ? 'text-white' : 'text-text-main'} group-hover:text-white transition-colors`}>
                          {match.home_team.name}
                        </span>
                        <span className="score text-[11px] font-black text-text-main group-hover:text-white transition-colors">
                          {match.home_score.current}
                        </span>
                      </div>
                      <div className="team flex justify-between items-center">
                        <span className={`team-name text-[11px] font-bold ${match.away_score.current > match.home_score.current && match.status.type === 'finished' ? 'text-white' : 'text-text-main'} group-hover:text-white transition-colors`}>
                          {match.away_team.name}
                        </span>
                        <span className="score text-[11px] font-black text-text-main group-hover:text-white transition-colors">
                          {match.away_score.current}
                        </span>
                      </div>
                    </div>
                    
                    <div className="match-star ml-4 text-text-muted group-hover:text-yellow-500 transition-colors opacity-40 group-hover:opacity-100">
                      <Star size={12} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
