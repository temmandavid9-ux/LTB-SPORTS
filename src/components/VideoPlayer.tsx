import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, PictureInPicture, RotateCcw, RotateCw, Settings, X } from 'lucide-react';

interface VideoPlayerProps {
  src?: string;
  embed?: string;
  title: string;
  onClose: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, embed, title, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    // Auto-play when src changes
    if (src) {
      video.play().catch(err => console.log('Auto-play blocked:', err));
    }

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) videoRef.current.currentTime = time;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      setIsMuted(vol === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      videoRef.current.muted = newMuted;
    }
  };

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error('PiP failed:', error);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const extractUrl = (embed: string) => {
    const match = embed.match(/src=['"]([^'"]+)['"]/);
    return match ? match[1] : '';
  };

  if (embed) {
    const url = extractUrl(embed);
    return (
      <div className="relative w-full h-full bg-black flex flex-col">
        <div className="flex items-center justify-between p-6 bg-slate-900 border-b border-slate-800">
          <div className="space-y-1">
            <h3 className="text-white font-black italic uppercase tracking-tight text-xl">{title}</h3>
            <div className="flex items-center gap-2">
              <span className="bg-red-600 text-[10px] font-black px-2 py-0.5 rounded uppercase text-white">LIVE FEED</span>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">ScoreBat Highlights</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all backdrop-blur-md border border-white/10"
          >
            <X size={24} />
          </button>
        </div>
        <div className="flex-1">
          <iframe 
            src={url} 
            className="w-full h-full" 
            allowFullScreen 
            title={title}
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full bg-black group overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full cursor-pointer"
        onClick={togglePlay}
        playsInline
      />

      {/* Overlay Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 flex flex-col justify-between p-6"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-white font-black italic uppercase tracking-tight text-xl">{title}</h3>
                <div className="flex items-center gap-2">
                  <span className="bg-red-600 text-[10px] font-black px-2 py-0.5 rounded uppercase">HD</span>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">LTB Sports Original</span>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all backdrop-blur-md border border-white/10"
              >
                <X size={24} />
              </button>
            </div>

            {/* Bottom Bar */}
            <div className="space-y-4">
              {/* Seek Bar */}
              <div className="group/seek relative flex items-center gap-4">
                <span className="text-white text-xs font-black w-12 text-right">{formatTime(currentTime)}</span>
                <div className="relative flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-red-600"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  />
                </div>
                <span className="text-white text-xs font-black w-12">{formatTime(duration)}</span>
              </div>

              {/* Main Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <button onClick={togglePlay} className="text-white hover:text-red-500 transition-colors">
                    {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                  </button>
                  
                  <div className="flex items-center gap-3 group/volume">
                    <button onClick={toggleMute} className="text-white hover:text-red-500 transition-colors">
                      {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </button>
                    <div className="w-0 group-hover/volume:w-24 overflow-hidden transition-all duration-300 flex items-center">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-full h-1 bg-white/20 rounded-full accent-red-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button 
                    onClick={togglePiP} 
                    className="text-white hover:text-red-500 transition-colors p-2"
                    title="Picture in Picture"
                  >
                    <PictureInPicture size={24} />
                  </button>
                  <button className="text-white hover:text-red-500 transition-colors p-2">
                    <Settings size={24} />
                  </button>
                  <button 
                    onClick={toggleFullscreen}
                    className="text-white hover:text-red-500 transition-colors p-2"
                  >
                    {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Big Play Button (when paused and controls visible) */}
      <AnimatePresence>
        {!isPlaying && showControls && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-24 h-24 bg-red-600 text-white rounded-full flex items-center justify-center shadow-2xl">
              <Play size={48} fill="currentColor" className="ml-2" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
