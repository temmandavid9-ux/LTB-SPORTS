import React, { useState, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { VoiceNote } from '../types';

interface VoiceNoteItemProps {
  note: VoiceNote;
}

export const VoiceNoteItem: React.FC<VoiceNoteItemProps> = ({ note }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!note.audioUrl) return;

    if (!audioRef.current || audioRef.current.src !== note.audioUrl) {
      audioRef.current = new Audio(note.audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = (e) => {
        console.error("Community voice note playback error:", e);
        setIsPlaying(false);
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => {
        console.error("Community playback failed:", err);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  return (
    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
      <img src={note.userPic} alt={note.username} className="w-10 h-10 rounded-full border border-slate-800" />
      <div className="flex-1">
        <p className="text-xs font-black uppercase tracking-tight">{note.username}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full bg-red-600 transition-all duration-300 ${isPlaying ? 'w-full' : 'w-0'}`} />
          </div>
          <span className="text-[10px] font-bold text-slate-500">{note.duration}</span>
        </div>
      </div>
      <button 
        onClick={togglePlay}
        className={`p-2 rounded-full transition-colors ${isPlaying ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
      >
        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
      </button>
    </div>
  );
};
