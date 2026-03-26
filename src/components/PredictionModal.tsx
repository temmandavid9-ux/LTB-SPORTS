import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Target, Zap, TrendingUp, ShieldCheck } from 'lucide-react';
import { Match } from '../types';

interface PredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  onPredict: (matchId: number, prediction: string) => void;
}

export const PredictionModal: React.FC<PredictionModalProps> = ({
  isOpen,
  onClose,
  match,
  onPredict
}) => {
  const [prediction, setPrediction] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!match) return null;

  const handleSubmit = () => {
    if (!prediction) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onPredict(match.id, prediction);
      setIsSubmitting(false);
      onClose();
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-slate-900 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-800 flex flex-col"
      >
            {/* Header */}
            <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                  <Trophy size={24} className="text-black" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight uppercase italic">Predict Winner</h2>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Earn XP for correct guesses</p>
                </div>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-slate-800 rounded-2xl transition-all text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
              {/* Match Display */}
              <div className="flex items-center justify-between gap-6 bg-slate-950 p-6 rounded-3xl border border-slate-800">
                <div className="flex-1 flex flex-col items-center gap-3">
                  <img 
                    src={`https://api.sofascore.app/api/v1/team/${match.home_team.id}/image`} 
                    alt={match.home_team.name} 
                    className="w-16 h-16 object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <span className="font-black text-xs text-center uppercase tracking-tight">{match.home_team.name}</span>
                </div>
                <div className="text-2xl font-black text-slate-700 italic">VS</div>
                <div className="flex-1 flex flex-col items-center gap-3">
                  <img 
                    src={`https://api.sofascore.app/api/v1/team/${match.away_team.id}/image`} 
                    alt={match.away_team.name} 
                    className="w-16 h-16 object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <span className="font-black text-xs text-center uppercase tracking-tight">{match.away_team.name}</span>
                </div>
              </div>

              {/* Prediction Options */}
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setPrediction('home')}
                  className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 group ${
                    prediction === 'home' 
                      ? 'bg-red-600 border-red-500 shadow-xl shadow-red-600/20' 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    prediction === 'home' ? 'bg-white/20' : 'bg-slate-900 group-hover:bg-slate-800'
                  }`}>
                    <Target size={20} className={prediction === 'home' ? 'text-white' : 'text-slate-500'} />
                  </div>
                  <span className="font-black text-[10px] uppercase tracking-widest">Home Win</span>
                </button>

                <button
                  onClick={() => setPrediction('draw')}
                  className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 group ${
                    prediction === 'draw' 
                      ? 'bg-slate-600 border-slate-500 shadow-xl shadow-slate-600/20' 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    prediction === 'draw' ? 'bg-white/20' : 'bg-slate-900 group-hover:bg-slate-800'
                  }`}>
                    <Zap size={20} className={prediction === 'draw' ? 'text-white' : 'text-slate-500'} />
                  </div>
                  <span className="font-black text-[10px] uppercase tracking-widest">Draw</span>
                </button>

                <button
                  onClick={() => setPrediction('away')}
                  className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 group ${
                    prediction === 'away' 
                      ? 'bg-blue-600 border-blue-500 shadow-xl shadow-blue-600/20' 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    prediction === 'away' ? 'bg-white/20' : 'bg-slate-900 group-hover:bg-slate-800'
                  }`}>
                    <TrendingUp size={20} className={prediction === 'away' ? 'text-white' : 'text-slate-500'} />
                  </div>
                  <span className="font-black text-[10px] uppercase tracking-widest">Away Win</span>
                </button>
              </div>

              {/* Stats/Info */}
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500">
                    <ShieldCheck size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Confidence Level</span>
                  </div>
                  <span className="text-xs font-black text-yellow-500">HIGH</span>
                </div>
                <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '85%' }}
                    className="h-full bg-yellow-500"
                  />
                </div>
                <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                  Based on recent form and head-to-head statistics, {match.home_team.name} has a slight edge in this matchup.
                </p>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!prediction || isSubmitting}
                className={`w-full py-6 rounded-3xl font-black text-xl tracking-tight transition-all flex items-center justify-center gap-3 ${
                  !prediction || isSubmitting
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-yellow-500 hover:bg-yellow-600 text-black shadow-xl shadow-yellow-500/20 active:scale-[0.98]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-4 border-black/20 border-t-black rounded-full animate-spin" />
                    SUBMITTING...
                  </>
                ) : (
                  <>
                    <Trophy size={24} />
                    LOCK IN PREDICTION
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
  );
};
