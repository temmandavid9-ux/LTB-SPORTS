import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, User, Mail, Lock, X, ArrowRight, AlertCircle } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType, googleProvider } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  signInWithRedirect
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: any) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async (useRedirect = false) => {
    setError(null);
    setLoading(true);
    try {
      if (useRedirect) {
        await signInWithRedirect(auth, googleProvider);
        return; // Redirect will happen
      }
      
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Fetch or Create Firestore Data
      let docSnap;
      try {
        docSnap = await getDoc(doc(db, 'users', user.uid));
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      }

      if (docSnap && docSnap.exists()) {
        onLogin(docSnap.data());
      } else {
        const newProfile = {
          uid: user.uid,
          username: user.displayName || 'Fan',
          email: user.email || '',
          bio: 'Football is life! ⚽',
          profilePic: user.photoURL || '',
          favoriteTeam: 'None',
          points: 1250,
          level: 5,
          createdAt: new Date().toISOString()
        };
        try {
          await setDoc(doc(db, 'users', user.uid), newProfile);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        }
        onLogin(newProfile);
      }
      onClose();
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      let msg = err.message || 'Google Login failed';
      if (err.code === 'auth/unauthorized-domain') {
        msg = `This domain (${globalThis.location.hostname}) is not authorized. Please add it to Firebase Console > Auth > Settings > Authorized Domains.`;
      } else if (err.code === 'auth/popup-blocked') {
        msg = 'Login popup was blocked. Try the "Redirect" option below or allow popups.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        msg = 'Login was cancelled. Please try again.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        if (!username.trim()) throw new Error('Username is required');
        
        // Create Auth User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update Auth Profile
        await updateProfile(user, { displayName: username });

        // Create Firestore Document
        const userDoc = {
          uid: user.uid,
          username,
          email,
          bio: 'Football is life! ⚽',
          profilePic: '',
          favoriteTeam: 'None',
          points: 1250,
          level: 5,
          createdAt: new Date().toISOString()
        };
        
        try {
          await setDoc(doc(db, 'users', user.uid), userDoc);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        }
        
        onLogin(userDoc);
      } else {
        // Sign In
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Fetch Firestore Data
        let docSnap;
        try {
          docSnap = await getDoc(doc(db, 'users', user.uid));
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
        }

        if (docSnap && docSnap.exists()) {
          onLogin(docSnap.data());
        } else {
          // Fallback if doc doesn't exist for some reason
          const fallbackProfile = {
            username: user.displayName || 'Fan',
            email: user.email,
            uid: user.uid,
            points: 1250,
            level: 5
          };
          onLogin(fallbackProfile);
        }
      }
      onClose();
    } catch (err: any) {
      console.error("Auth Error:", err);
      // Try to parse JSON error if it's from handleFirestoreError
      let displayError = err.message || 'An error occurred during authentication';
      
      if (err.code === 'auth/unauthorized-domain') {
        displayError = `This domain (${globalThis.location.hostname}) is not authorized for Firebase Authentication. Please add it to the authorized domains in your Firebase Console.`;
      } else {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.error) displayError = `Database Error: ${parsed.error}`;
        } catch (e) {
          // Not a JSON error
        }
      }
      setError(displayError);
    } finally {
      setLoading(false);
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
                {isRegistering ? 'Create your LTB SPORTS account' : 'Login to access your profile & tips'}
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => handleGoogleLogin(false)}
                disabled={loading}
                className="w-full bg-white hover:bg-slate-100 text-slate-900 py-4 rounded-2xl font-black text-sm tracking-tight transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 disabled:opacity-50"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                CONTINUE WITH GOOGLE
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => handleGoogleLogin(true)}
                  disabled={loading}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  Use Redirect
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all"
                >
                  Continue as Guest
                </button>
              </div>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                  <span className="bg-slate-900 px-4 text-slate-500">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold"
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-red-500 transition-all font-bold text-white"
                  />
                </div>
              </div>

              {isRegistering && (
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
              )}

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
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 py-5 rounded-2xl font-black text-lg tracking-tight transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-2 text-white active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'PROCESSING...' : (isRegistering ? 'CREATE ACCOUNT' : 'SIGN IN')} <ArrowRight size={20} />
              </button>
            </form>
          </div>

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
