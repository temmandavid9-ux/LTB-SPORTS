import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { CheckCircle2, Trophy } from 'lucide-react';
import { Poll } from '../types';

interface PollWidgetProps {
  poll: Poll;
  onVote: (optionId: string) => void;
}

export const PollWidget: React.FC<PollWidgetProps> = ({ poll, onVote }) => {
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = (id: string) => {
    if (poll.hasVoted) return;
    setIsVoting(true);
    setTimeout(() => {
      onVote(id);
      setIsVoting(false);
    }, 600);
  };

  const data = poll.options.map(opt => ({
    name: opt.text,
    votes: opt.votes,
    percentage: poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0,
    id: opt.id
  }));

  return (
    <div className="bg-slate-950 p-6 rounded-[2rem] border border-slate-800 space-y-6 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-yellow-500">
          <Trophy size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">Live Fan Poll</span>
        </div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {poll.totalVotes} Votes Cast
        </div>
      </div>

      <h3 className="text-xl font-black tracking-tight leading-tight italic uppercase">
        {poll.question}
      </h3>

      <div className="space-y-3">
        {poll.options.map((option) => {
          const percentage = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
          const isSelected = poll.votedOptionId === option.id;

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={poll.hasVoted || isVoting}
              className={`w-full relative group transition-all ${poll.hasVoted ? 'cursor-default' : 'hover:scale-[1.02] active:scale-95'}`}
            >
              <div className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between relative z-10 ${
                isSelected 
                  ? 'bg-red-600/20 border-red-500/50' 
                  : poll.hasVoted 
                    ? 'bg-slate-900/50 border-slate-800/50' 
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${isSelected ? 'text-red-500' : 'text-slate-200'}`}>
                    {option.text}
                  </span>
                  {isSelected && <CheckCircle2 size={16} className="text-red-500" />}
                </div>
                {poll.hasVoted && (
                  <span className="text-xs font-black text-slate-400">{percentage}%</span>
                )}
              </div>
              
              {poll.hasVoted && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`absolute inset-0 rounded-2xl opacity-10 ${isSelected ? 'bg-red-600' : 'bg-slate-400'}`}
                />
              )}
            </button>
          );
        })}
      </div>

      {poll.hasVoted && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-48 w-full mt-4"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: -20, right: 20 }}>
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                width={80}
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg shadow-xl">
                        <p className="text-[10px] font-black text-white uppercase tracking-widest">
                          {payload[0].value} Votes
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="votes" radius={[0, 4, 4, 0]} barSize={20}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.id === poll.votedOptionId ? '#dc2626' : '#334155'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
};
