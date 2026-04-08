import React from 'react';
import { Youtube, Instagram, Linkedin, Facebook, Twitter, Send } from 'lucide-react';

interface FooterProps {
  onLtbChannelClick: (url?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onLtbChannelClick }) => {
  return (
    <footer className="bg-slate-950 text-white pt-16 pb-8 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
        <div className="space-y-6">
          <div className="flex items-center justify-center md:justify-start gap-4">
            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform">
              <span className="font-black text-xl tracking-tighter">LTB</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight uppercase">LTB SPORTS</h2>
          </div>
          <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xs mx-auto md:mx-0">
            Fastest live scores & football news. Your #1 destination for live football and fan interaction.
          </p>
        </div>

        <div className="space-y-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Connect with us</h3>
          <div className="flex items-center justify-center md:justify-start gap-6">
            <button 
              onClick={() => onLtbChannelClick("https://www.youtube.com/@LTBLIVESPORTSTV")} 
              className="text-slate-400 hover:text-red-500 transition-colors" 
              title="LTB Channel"
            >
              <Youtube size={24} />
            </button>
            <button 
              onClick={() => onLtbChannelClick("https://www.youtube.com/@LTBDailyTips")} 
              className="text-slate-400 hover:text-red-500 transition-colors" 
              title="Dailly Football Tips"
            >
              <Youtube size={24} className="text-red-500" />
            </button>
            <a href="#" className="text-slate-400 hover:text-red-500 transition-colors"><Instagram size={24} /></a>
            <a href="#" className="text-slate-400 hover:text-red-500 transition-colors"><Linkedin size={24} /></a>
            <a href="#" className="text-slate-400 hover:text-red-500 transition-colors"><Facebook size={24} /></a>
            <a href="#" className="text-slate-400 hover:text-red-500 transition-colors"><Twitter size={24} /></a>
            <a href="#" className="text-slate-400 hover:text-red-500 transition-colors"><Send size={24} /></a>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Developed by</h3>
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-slate-400 text-sm font-medium">Crafted with ❤️ by</span>
            <strong className="text-2xl font-black tracking-tight text-red-600 uppercase">URIEL DAVID</strong>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-slate-900 text-center">
        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">
          © 2026 LTB Live Football Sports. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
