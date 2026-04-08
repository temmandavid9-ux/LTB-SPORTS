import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    globalThis.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong. Our scouts are on it!";
      let isFirebaseError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error) {
            errorMessage = parsed.error;
            isFirebaseError = true;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 bg-red-600/10 rounded-3xl flex items-center justify-center mx-auto border border-red-500/20">
              <AlertTriangle size={40} className="text-red-500" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight uppercase italic">Match Interrupted</h1>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                {errorMessage}
              </p>
            </div>

            {isFirebaseError && errorMessage.includes('unauthorized-domain') && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-left">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Security Note</p>
                <p className="text-[10px] text-amber-200/70 leading-tight">
                  This domain is not allowlisted in Firebase. Please add <span className="font-mono text-white">{globalThis.location.hostname}</span> to your Firebase Auth Settings.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-red-600 hover:bg-red-700 py-4 rounded-2xl font-black text-lg tracking-tight transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
              >
                <RefreshCw size={20} /> REFRESH PAGE
              </button>
              <button
                onClick={() => globalThis.location.href = '/'}
                className="w-full bg-slate-800 hover:bg-slate-700 py-4 rounded-2xl font-black text-lg tracking-tight transition-all flex items-center justify-center gap-2"
              >
                <Home size={20} /> BACK TO HOME
              </button>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">LTB SPORTS • Error ID: {Math.random().toString(36).substring(7)}</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
