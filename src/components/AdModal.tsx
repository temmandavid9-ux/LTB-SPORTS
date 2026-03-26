import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Play } from 'lucide-react';

interface AdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  hasWatchedAd: boolean;
}

export const AdModal: React.FC<AdModalProps> = ({ isOpen, onClose, onContinue, hasWatchedAd }) => {
  const [seconds, setSeconds] = useState(5);
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSeconds(5);
      setCanContinue(false);
      return;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanContinue(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-2xl relative"
          >
            <div className="p-8 space-y-6 text-center">
              <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mx-auto border-4 border-red-600/20">
                <Play size={32} className="text-red-600 animate-pulse" fill="currentColor" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black italic uppercase tracking-tight">
                  {!hasWatchedAd ? 'Support LTB Sports' : 'Preparing Content...'}
                </h3>
                <p className="text-slate-500 text-sm font-medium">
                  {!hasWatchedAd 
                    ? 'Watch a quick ad to unlock all premium content for this session.' 
                    : 'Thank you for your support! Your content is ready.'}
                </p>
              </div>

              {/* AD SPACE - Paste AdSense or PropellerAds code here */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 min-h-[150px] flex flex-col items-center justify-center space-y-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-600 border border-slate-800 px-3 py-1 rounded-full flex items-center gap-2">
                  <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                  {!hasWatchedAd ? 'Sponsored Content' : 'Premium Access Unlocked'}
                </div>
                <div className="text-slate-400 text-sm italic">
                  {!hasWatchedAd 
                    ? 'Support LTB Sports by viewing this short ad.' 
                    : 'You have successfully unlocked access!'}
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 5, ease: "linear" }}
                    className="h-full bg-red-600"
                  />
                </div>
              </div>

              <button
                onClick={onContinue}
                disabled={!canContinue}
                className={`w-full py-4 rounded-2xl font-black text-lg tracking-tight transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  canContinue 
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/20' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {canContinue ? (
                  <>
                    {!hasWatchedAd ? 'WATCH AD TO UNLOCK' : 'CONTINUE TO WATCH'} 
                    <ExternalLink size={20} />
                  </>
                ) : (
                  <>CONTINUE IN {seconds}S</>
                )}
              </button>
              
              <button 
                onClick={onClose}
                className="text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
              >
                Cancel and return
              </button>
            </div>

            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
