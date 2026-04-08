import React, { useState } from 'react';
import { Coffee, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SupportCard: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-slate-800 rounded-3xl p-8 text-center shadow-2xl border border-slate-700 max-w-2xl mx-auto my-12 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600"></div>
      
      <div className="w-20 h-20 bg-slate-900 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg border border-slate-700 group-hover:scale-110 transition-transform">
        <Coffee size={40} className="text-yellow-500" />
      </div>

      <h3 className="text-2xl font-black tracking-tight mb-2 uppercase">Support LTB Live Sports</h3>
      <p className="text-slate-400 text-sm mb-8 font-medium">Help us keep the servers running and the scores live! Every contribution matters.</p>

      <div className="space-y-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 py-4 rounded-2xl font-black text-lg tracking-tight transition-all shadow-lg hover:shadow-red-600/20 active:scale-95"
        >
          <CreditCard size={24} />
          BANK TRANSFER
          {showDetails ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 text-left space-y-4 shadow-inner">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Bank</span>
                  <span className="font-bold text-slate-200">OPay / Access Bank</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Account</span>
                  <span className="font-bold text-slate-200">9137329418 / 1535282451</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Name</span>
                  <span className="font-bold text-slate-200">Emmanuel David</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
