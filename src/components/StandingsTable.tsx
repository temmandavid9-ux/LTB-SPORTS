import React from 'react';
import { motion } from 'motion/react';
import { Standing } from '../types';

interface StandingsTableProps {
  standings: Standing[];
  leagueName: string;
  isRefreshing?: boolean;
  favoriteTeam?: string;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ standings, leagueName, isRefreshing, favoriteTeam }) => {
  return (
    <div className="bg-slate-800 rounded-2xl overflow-hidden shadow-xl border border-slate-700">
      <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span className="text-red-600">🏆</span> {leagueName} <span className="text-slate-500 text-xs font-medium">(Season 2025/26)</span>
        </h2>
        {isRefreshing && (
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-yellow-500 rounded-full animate-ping"></div>
            <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Updating...</span>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/30 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3 text-center">PL</th>
              <th className="px-4 py-3 text-center">W</th>
              <th className="px-4 py-3 text-center">D</th>
              <th className="px-4 py-3 text-center">L</th>
              <th className="px-4 py-3 text-center">GD</th>
              <th className="px-4 py-3 text-center text-red-500">PTS</th>
              <th className="px-4 py-3 text-center">FORM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {standings.map((row) => {
              const isLeader = row.position === 1;
              const isTitleRace = row.position <= 3;
              const isRelegation = row.position >= standings.length - 2;
              const isFavorite = favoriteTeam && row.team.name.toLowerCase().includes(favoriteTeam.toLowerCase());
              
              let rowBgClass = "hover:bg-slate-700/30";
              let borderLeftClass = "border-l-4 border-l-transparent";
              
              if (isFavorite) {
                rowBgClass = "bg-red-600/20 hover:bg-red-600/30";
                borderLeftClass = "border-l-4 border-l-red-600 ring-inset ring-1 ring-red-600/30";
              } else if (isLeader) {
                rowBgClass = "bg-yellow-500/10 hover:bg-yellow-500/20";
                borderLeftClass = "border-l-4 border-l-yellow-500";
              } else if (row.position === 2) {
                rowBgClass = "bg-slate-400/10 hover:bg-slate-400/20";
                borderLeftClass = "border-l-4 border-l-slate-400";
              } else if (row.position === 3) {
                rowBgClass = "bg-orange-500/10 hover:bg-orange-500/20";
                borderLeftClass = "border-l-4 border-l-orange-500";
              } else if (isRelegation) {
                rowBgClass = "bg-red-500/10 hover:bg-red-500/20";
                borderLeftClass = "border-l-4 border-l-red-500";
              }

              return (
                <motion.tr 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: row.position * 0.03 }}
                  key={row.team.id} 
                  className={`transition-all duration-300 ${rowBgClass} ${borderLeftClass}`}
                >
                  <td className="px-4 py-4 font-bold text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black ${
                        row.status === 'up' ? 'text-green-500' : row.status === 'down' ? 'text-red-500' : 'text-slate-600'
                      }`}>
                        {row.status === 'up' ? '▲' : row.status === 'down' ? '▼' : '•'}
                      </span>
                      <span>{row.position}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={row.team.logo}
                        alt={row.team.name}
                        className="w-8 h-8 object-contain"
                        referrerPolicy="no-referrer"
                        onError={(e) => (e.currentTarget.src = "https://picsum.photos/seed/football/100/100")}
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-black whitespace-nowrap text-base tracking-tight">{row.team.name}</span>
                          {isLeader && (
                            <span className="bg-yellow-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest shadow-lg shadow-yellow-500/20">
                              Leader
                            </span>
                          )}
                          {isRelegation && (
                            <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest shadow-lg shadow-red-600/20">
                              Danger
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-slate-300">{row.played}</td>
                  <td className="px-4 py-4 text-center font-medium text-slate-400">{row.won}</td>
                  <td className="px-4 py-4 text-center font-medium text-slate-400">{row.draw}</td>
                  <td className="px-4 py-4 text-center font-medium text-slate-400">{row.lost}</td>
                  <td className="px-4 py-4 text-center font-black text-slate-500">{row.goalsDiff ?? (row.goalsFor - row.goalsAgainst)}</td>
                  <td className="px-4 py-4 text-center font-black text-red-500 text-lg">{row.points}</td>
                  <td className="px-4 py-4 text-center whitespace-nowrap">
                    <div className="flex gap-1.5 justify-center">
                      {row.form?.split('').map((char, i) => (
                        <span 
                          key={i} 
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg ${
                            char === 'W' ? 'bg-green-500 shadow-green-500/20' : 
                            char === 'L' ? 'bg-red-500 shadow-red-500/20' : 
                            'bg-slate-600 shadow-slate-600/20'
                          }`}
                        >
                          {char}
                        </span>
                      )) || '-'}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
