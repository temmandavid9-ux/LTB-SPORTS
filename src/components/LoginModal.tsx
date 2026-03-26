import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, User, Mail, Lock, X, ArrowRight } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-slate-900 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-800 p-8 relative"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-8 space-y-2">
              <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-red-600/20 mb-4">
                <LogIn size={32} className="text-white" />
              </div>
              <h2 className="text-3xl font-black tracking-tight uppercase italic italic">
                {isRegistering ? 'Join the Club' : 'Welcome Back'}
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                {isRegistering ? 'Create your LTB LIVE account' : 'Login to access your profile & tips'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegistering && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-red-500 transition-all font-bold text-white"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-red-500 transition-all font-bold text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-red-500 transition-all font-bold text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 py-5 rounded-2xl font-black text-lg tracking-tight transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-2 text-white active:scale-95"
              >
                {isRegistering ? 'CREATE ACCOUNT' : 'SIGN IN'} <ArrowRight size={20} />
              </button>
            </form>

            <div className="mt-8 text-center">
              <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-slate-500 hover:text-white text-xs font-black uppercase tracking-widest transition-colors"
              >
                {isRegistering ? 'Already have an account? Login' : 'New here? Create an account'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
