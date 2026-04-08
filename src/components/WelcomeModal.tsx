import React from 'react';
import { motion } from 'motion/react';
import { X, Trophy, MessageCircle, Zap } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-slate-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-700"
      >
            <div className="bg-red-600 p-8 text-center relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                <span className="text-red-600 font-black text-2xl tracking-tighter">LTB</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">Welcome to LTB SPORTS!</h2>
              <p className="text-red-100 text-sm font-medium mt-1 uppercase tracking-widest">Your #1 football destination</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-slate-800 p-3 rounded-2xl border border-slate-800 text-red-500">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Match Updates</h3>
                    <p className="text-slate-400 text-sm">Real-time updates & goal alerts for all major leagues.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700 text-yellow-500">
                    <Trophy size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Match Predictor</h3>
                    <p className="text-slate-400 text-sm">Vote on match winners and see what other fans think!</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700 text-blue-500">
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Fan Zone</h3>
                    <p className="text-slate-400 text-sm">Join the live discussion with fans from around the world.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-red-600 hover:bg-red-700 py-4 rounded-2xl font-black text-lg tracking-tight transition-all shadow-lg hover:shadow-red-600/20 active:scale-95"
              >
                GET STARTED
              </button>
            </div>
          </motion.div>
        </motion.div>
  );
};
