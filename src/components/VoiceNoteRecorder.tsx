import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Play, Pause, Trash2, Send, Clock, Volume2, VolumeX } from 'lucide-react';
import { VoiceNote } from '../types';

interface VoiceNoteRecorderProps {
  onSend: (duration: string, audioUrl: string) => void;
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({ onSend }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedNote, setRecordedNote] = useState<{ duration: string; audioUrl: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      // Only revoke if it wasn't sent to the parent
      if (lastUrlRef.current) {
        URL.revokeObjectURL(lastUrlRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      // Cleanup previous unsent recording
      if (lastUrlRef.current) {
        URL.revokeObjectURL(lastUrlRef.current);
        lastUrlRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : MediaRecorder.isTypeSupported('audio/ogg') 
          ? 'audio/ogg' 
          : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        lastUrlRef.current = audioUrl;
        
        const mins = Math.floor(recordingTime / 60);
        const secs = recordingTime % 60;
        const duration = `${mins}:${secs.toString().padStart(2, '0')}`;
        
        setRecordedNote({ duration, audioUrl });
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or not available. Please check your browser settings.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const togglePlayback = () => {
    if (!recordedNote) return;
    
    if (!audioRef.current || audioRef.current.src !== recordedNote.audioUrl) {
      audioRef.current = new Audio(recordedNote.audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = (e) => {
        console.error("Audio playback error:", e);
        setIsPlaying(false);
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => {
        console.error("Playback failed:", err);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSend = () => {
    if (recordedNote) {
      onSend(recordedNote.duration, recordedNote.audioUrl);
      // Clear reference so it doesn't get revoked by this component
      lastUrlRef.current = null;
      setRecordedNote(null);
      setRecordingTime(0);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
    }
  };

  const handleDelete = () => {
    if (recordedNote?.audioUrl) {
      URL.revokeObjectURL(recordedNote.audioUrl);
      lastUrlRef.current = null;
    }
    setRecordedNote(null);
    setRecordingTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  };

  return (
    <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 space-y-6 shadow-2xl relative overflow-hidden">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black italic uppercase tracking-tight">Fan Phone-In</h3>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
          <Mic size={14} className={isRecording ? 'text-red-500 animate-pulse' : ''} />
          {isRecording ? 'Recording Live...' : 'Record your message'}
        </div>
      </div>

      <div className="relative h-32 bg-slate-950 rounded-3xl border border-slate-800 flex items-center justify-center overflow-hidden">
        {isRecording ? (
          <div className="flex items-center gap-1">
            {[...Array(24)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  height: [8, Math.random() * 40 + 10, 8],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 0.5 + Math.random() * 0.5,
                  delay: i * 0.05
                }}
                className="w-1 bg-red-600 rounded-full"
              />
            ))}
          </div>
        ) : recordedNote ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-4">
              <button 
                onClick={togglePlayback}
                className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-700 transition-all active:scale-95"
              >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
              </button>
              <div className="flex gap-0.5 items-center">
                {[...Array(12)].map((_, i) => (
                  <motion.div 
                    key={i} 
                    animate={isPlaying ? { height: [8, 24, 8] } : { height: 8 }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                    className="w-1 bg-slate-700 rounded-full" 
                  />
                ))}
              </div>
            </div>
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{recordedNote.duration}</span>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-slate-900 rounded-full mx-auto flex items-center justify-center text-slate-700 border border-slate-800">
              <VolumeX size={24} />
            </div>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">No recording yet</p>
          </div>
        )}

        {isRecording && (
          <div className="absolute top-4 right-6 text-xl font-black text-red-500 font-mono">
            {formatTime(recordingTime)}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {!recordedNote ? (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-lg tracking-tight transition-all shadow-xl active:scale-95 ${
              isRecording 
                ? 'bg-white text-black hover:bg-slate-200' 
                : 'bg-red-600 text-white hover:bg-red-700 shadow-red-600/20'
            }`}
          >
            {isRecording ? (
              <>
                <div className="w-3 h-3 bg-red-600 rounded-sm animate-pulse" />
                STOP RECORDING
              </>
            ) : (
              <>
                <Mic size={20} />
                START RECORDING
              </>
            )}
          </button>
        ) : (
          <>
            <button
              onClick={handleDelete}
              className="p-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl transition-all active:scale-95"
            >
              <Trash2 size={24} />
            </button>
            <button
              onClick={handleSend}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black text-lg tracking-tight transition-all shadow-xl shadow-red-600/20 active:scale-95 flex items-center justify-center gap-3"
            >
              <Send size={20} />
              POST VOICE NOTE
            </button>
          </>
        )}
      </div>
    </div>
  );
};
