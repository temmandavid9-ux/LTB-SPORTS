import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the default small mini-bar from showing
      e.preventDefault();
      // Save the event so we can trigger it later
      setDeferredPrompt(e);
      // Show our custom banner
      setIsVisible(true);
    };

    globalThis.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Hide banner if already installed
    globalThis.addEventListener('appinstalled', () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      console.log('PWA was installed successfully!');
    });

    // Check if already in standalone mode
    if (globalThis.matchMedia('(display-mode: standalone)').matches) {
      setIsVisible(false);
    }

    return () => {
      globalThis.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the official browser install prompt
      deferredPrompt.prompt();
      // Wait for the user's choice
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install: ${outcome}`);
      // We've used the prompt, so clear it
      setDeferredPrompt(null);
      // Hide our banner
      setIsVisible(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0, x: '-50%' }}
          animate={{ y: 0, opacity: 1, x: '-50%' }}
          exit={{ y: 100, opacity: 0, x: '-50%' }}
          className="fixed bottom-6 left-1/2 z-[9999] w-[90%] max-w-md bg-amber-400 p-4 rounded-2xl shadow-2xl border border-amber-300 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-xl text-amber-400">
              <Download size={20} />
            </div>
            <div>
              <p className="text-slate-900 font-black text-xs uppercase tracking-tight">Get Instant Goal Alerts!</p>
              <p className="text-slate-800 text-[10px] font-bold uppercase tracking-widest opacity-80">Install our official app</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-colors active:scale-95"
            >
              Install
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-2 text-slate-800 hover:bg-amber-500/20 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
