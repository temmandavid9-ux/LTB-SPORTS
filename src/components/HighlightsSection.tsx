import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Tv, Sparkles, Clock, Calendar, ChevronRight, Video, Download, X, Youtube, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { VideoPlayer } from './VideoPlayer';
import { getScoreBatHighlights } from '../services/api';
import { ScoreBatHighlight, Match, Highlight } from '../types';

interface HighlightsSectionProps {
  isTheaterMode: boolean;
  setIsTheaterMode: (val: boolean) => void;
  pendingHighlights: Match[];
  setPendingHighlights: React.Dispatch<React.SetStateAction<Match[]>>;
  pollerStatus: string;
  onSectionChange: (section: 'highlights' | 'community' | 'live-stream' | 'ltb-tv') => void;
  onWatchHighlight: (highlight: Highlight) => void;
  onLtbChannelClick: (url?: string) => void;
  activeHighlight: Highlight | null;
  setActiveHighlight: (highlight: Highlight | null) => void;
}

export const HighlightsSection: React.FC<HighlightsSectionProps> = ({
  isTheaterMode,
  setIsTheaterMode,
  pendingHighlights,
  setPendingHighlights,
  pollerStatus,
  onSectionChange,
  onWatchHighlight,
  onLtbChannelClick,
  activeHighlight,
  setActiveHighlight
}) => {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Highlight | null>(null);
  const [selectedReplay, setSelectedReplay] = useState<Highlight | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState<boolean>(false);

  useEffect(() => {
    if (activeHighlight) {
      setSelectedVideo(activeHighlight);
      setActiveHighlight(null);
      globalThis.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeHighlight, setActiveHighlight]);

  useEffect(() => {
    if (selectedVideo || selectedReplay) {
      globalThis.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedVideo, selectedReplay]);

  useEffect(() => {
    const fetchHighlights = async () => {
      setLoading(true);
      try {
        const data = await getScoreBatHighlights();
        const mapped: Highlight[] = data.map((h, i) => ({
          id: i.toString(),
          matchName: h.title,
          date: new Date(h.date).toLocaleDateString(),
          duration: 'Highlights',
          thumbnail: h.thumbnail,
          videoUrl: '',
          league: h.competition,
          embed: h.videos[0]?.embed
        }));
        setHighlights(mapped);
      } catch (error) {
        console.error("Error fetching highlights:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHighlights();
  }, []);

  useEffect(() => {
    const checkKey = async () => {
      if ((globalThis as any).aistudio) {
        const selected = await (globalThis as any).aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if ((globalThis as any).aistudio) {
      await (globalThis as any).aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const generateAISummary = async (matchName: string) => {
    if (!hasKey) {
      await handleSelectKey();
    }

    setIsGenerating(true);
    setGeneratedVideoUrl(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || '' });
      
      let operation = await (ai as any).models.generateVideos({
        model: 'veo-3.1-lite-generate-preview',
        prompt: `A cinematic, high-energy 5-second sports highlight summary of the football match: ${matchName}. Show dramatic goals, crowd celebrations, and intense action in a professional broadcast style.`,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      // Poll for completion
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        // Fetch the video as a blob to handle authentication
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': (import.meta as any).env.VITE_GEMINI_API_KEY || '',
          },
        });
        
        if (!response.ok) throw new Error('Failed to download generated video');
        
        const blob = await response.blob();
        const localUrl = URL.createObjectURL(blob);
        setGeneratedVideoUrl(localUrl);
      }
    } catch (error: any) {
      console.error("Error generating video:", error);
      if (error.message?.includes("Requested entity was not found")) {
        setHasKey(false);
        alert("Please select a valid API key with billing enabled to use the AI Video Engine.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const extractUrl = (embed: string) => {
    const match = embed.match(/src=['"]([^'"]+)['"]/);
    return match ? match[1] : '';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 size={48} className="text-blue-500 animate-spin" />
        <p className="text-slate-500 font-black uppercase tracking-widest animate-pulse">Fetching Latest Highlights...</p>
      </div>
    );
  }

  const featured = highlights[0] || {
    id: '0',
    matchName: 'No Highlights Found',
    date: '',
    duration: '',
    thumbnail: 'https://picsum.photos/seed/football/1920/1080',
    videoUrl: '',
    league: 'FOOTBALL'
  };

  return (
    <div className={`space-y-12 ${isTheaterMode ? 'max-w-none px-0' : ''}`}>
      {/* Poller Status */}
      {pollerStatus && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
            <span className="text-xs font-black uppercase tracking-widest text-blue-500">{pollerStatus}</span>
          </div>
          <button 
            onClick={() => setPendingHighlights([])}
            className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
          >
            Stop Poller
          </button>
        </motion.div>
      )}

      {/* Active Video Player (Theater Mode) */}
      <AnimatePresence mode="wait">
        {selectedVideo && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative bg-black overflow-hidden shadow-2xl border-b border-slate-800"
          >
            <div className="max-w-7xl mx-auto aspect-video relative">
              <VideoPlayer 
                src={selectedVideo.videoUrl} 
                embed={selectedVideo.embed}
                title={selectedVideo.matchName} 
                onClose={() => setSelectedVideo(null)} 
              />
            </div>
            <div className="max-w-7xl mx-auto p-6 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20">
                  <Video size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black italic uppercase tracking-tight">{selectedVideo.matchName}</h3>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Now Watching • {selectedVideo.league}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsTheaterMode(!isTheaterMode)}
                  className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all text-slate-400 hover:text-white"
                  title={isTheaterMode ? "Exit Theater Mode" : "Enter Theater Mode"}
                >
                  {isTheaterMode ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
                </button>
                <button 
                  onClick={() => setSelectedVideo(null)}
                  className="p-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-2xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Hero Highlight (Only show if no video is selected) */}
      {!selectedVideo && (
        <section className={`relative rounded-[3rem] overflow-hidden group shadow-2xl border border-slate-800 transition-all duration-500 ${isTheaterMode ? 'h-[80vh] rounded-none border-x-0' : 'h-[500px]'}`}>
        <img 
          src={featured.thumbnail} 
          alt="Featured Highlight" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-12">
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center gap-3">
              <span className="bg-red-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Featured</span>
              <span className="text-slate-300 text-xs font-bold uppercase tracking-widest">{featured.league}</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter italic uppercase leading-none">
              {featured.matchName}
            </h2>
            <div className="flex items-center gap-6 text-slate-400 text-sm font-bold">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                {featured.date}
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                {featured.duration}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button 
                onClick={() => onWatchHighlight(featured)}
                className="bg-white text-black px-8 py-4 rounded-2xl font-black text-lg tracking-tight flex items-center gap-3 hover:bg-red-600 hover:text-white transition-all shadow-xl active:scale-95"
              >
                <Play size={24} fill="currentColor" />
                WATCH NOW
              </button>
              <button 
                onClick={() => setIsTheaterMode(!isTheaterMode)}
                className="bg-slate-900/80 backdrop-blur-md text-white border border-slate-700 px-8 py-4 rounded-2xl font-black text-lg tracking-tight flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl"
              >
                {isTheaterMode ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
                {isTheaterMode ? 'EXIT THEATER' : 'THEATER MODE'}
              </button>
              <button 
                onClick={() => onLtbChannelClick("https://www.youtube.com/@LTBLIVESPORTSTV")}
                className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-lg tracking-tight flex items-center gap-3 hover:bg-red-700 transition-all shadow-xl active:scale-95"
              >
                <Youtube size={24} />
                LTB Channel
              </button>
              <button 
                onClick={() => onLtbChannelClick("https://www.youtube.com/@LTBDailyTips")}
                className="bg-slate-900/80 backdrop-blur-md text-white border border-slate-700 px-8 py-4 rounded-2xl font-black text-lg tracking-tight flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl active:scale-95"
              >
                <Youtube size={24} className="text-red-500" />
                Dailly Football Tips
              </button>
              <button 
                onClick={() => generateAISummary(featured.matchName)}
                disabled={isGenerating}
                className="bg-slate-900/80 backdrop-blur-md text-white border border-slate-700 px-8 py-4 rounded-2xl font-black text-lg tracking-tight flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50"
              >
                <Sparkles size={24} className="text-yellow-500" />
                {isGenerating ? 'GENERATING AI SUMMARY...' : 'GENERATE AI SUMMARY'}
              </button>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* AI Generation Status */}
      <AnimatePresence>
        {(isGenerating || generatedVideoUrl) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8"
          >
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${isGenerating ? 'bg-yellow-500/20 animate-pulse' : 'bg-green-500/20'}`}>
                {isGenerating ? <Sparkles size={32} className="text-yellow-500" /> : <Video size={32} className="text-green-500" />}
              </div>
              <div>
                <h3 className="text-xl font-black italic uppercase tracking-tight">
                  {isGenerating ? 'AI Video Engine is Cooking...' : 'AI Summary Ready!'}
                </h3>
                <p className="text-slate-500 text-sm font-medium">
                  {isGenerating 
                    ? 'Analyzing match data and generating cinematic highlights using Veo 3.1...' 
                    : 'Your custom match summary has been generated successfully.'}
                </p>
              </div>
            </div>
            {generatedVideoUrl && (
              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                <button 
                  onClick={() => setSelectedVideo({
                    id: 'generated',
                    matchName: 'AI Generated Summary',
                    date: new Date().toLocaleDateString(),
                    duration: '0:05',
                    thumbnail: 'https://picsum.photos/seed/ai/800/450',
                    videoUrl: generatedVideoUrl,
                    league: 'AI GENERATED'
                  })}
                  className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black tracking-tight flex items-center justify-center gap-3 transition-all shadow-lg"
                >
                  <Play size={20} fill="currentColor" />
                  WATCH SUMMARY
                </button>
                <a 
                  href={generatedVideoUrl} 
                  download="match-summary.mp4"
                  className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-2xl font-black tracking-tight flex items-center justify-center gap-3 transition-all shadow-lg"
                >
                  <Download size={20} />
                  DOWNLOAD
                </a>
                <button 
                  onClick={() => {
                    URL.revokeObjectURL(generatedVideoUrl);
                    setGeneratedVideoUrl(null);
                  }}
                  className="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Highlights Grid */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
            <h2 className="text-2xl font-black tracking-tight uppercase italic">Recent Highlights</h2>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-2">(Soccer Only)</span>
          </div>
          <button className="text-slate-500 hover:text-white flex items-center gap-2 font-bold text-sm uppercase tracking-widest transition-colors">
            View All <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {highlights.slice(1).map((highlight) => (
            <motion.div
              key={highlight.id}
              whileHover={{ y: -10 }}
              className="bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-800 group shadow-xl"
            >
              <div className="relative aspect-video overflow-hidden">
                <img 
                  src={highlight.thumbnail} 
                  alt={highlight.matchName} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={() => onWatchHighlight(highlight)}
                    className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-transform"
                  >
                    <Play size={24} fill="currentColor" />
                  </button>
                </div>
                <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black text-white">
                  {highlight.duration}
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-blue-500 text-[10px] font-black uppercase tracking-widest">{highlight.league}</span>
                  <span className="text-slate-600 text-[10px] font-bold">{highlight.date}</span>
                </div>
                <h3 className="text-lg font-black italic uppercase tracking-tight group-hover:text-blue-500 transition-colors">
                  {highlight.matchName}
                </h3>
                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={() => generateAISummary(highlight.matchName)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-slate-700"
                  >
                    <Sparkles size={14} className="text-yellow-500" />
                    AI Summary
                  </button>
                  <button 
                    onClick={() => onLtbChannelClick("https://www.youtube.com/@LTBLIVESPORTSTV")}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-slate-700"
                  >
                    <Tv size={14} />
                    Full Replay
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Active Replay Player (Theater Mode) */}
      <AnimatePresence mode="wait">
        {selectedReplay && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative bg-slate-900 overflow-hidden shadow-2xl border-b border-slate-800"
          >
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row">
              <div className="flex-1 bg-black aspect-video relative">
                <VideoPlayer 
                  src={selectedReplay.videoUrl} 
                  title={selectedReplay.matchName} 
                  onClose={() => setSelectedReplay(null)} 
                />
              </div>
              <div className="w-full lg:w-96 bg-slate-950 p-8 overflow-y-auto border-l border-slate-800 space-y-8 max-h-[600px] custom-scrollbar">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-1 h-4 bg-red-600 rounded-full"></div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Key Moments</h4>
                  </div>
                  <div className="space-y-3">
                    {[
                      { time: "12'", event: "Goal - Haaland", type: "goal" },
                      { time: "34'", event: "Yellow Card - Rodri", type: "card" },
                      { time: "45+2'", event: "Half Time", type: "whistle" },
                      { time: "67'", event: "Goal - Saka", type: "goal" },
                      { time: "89'", event: "Red Card - White", type: "card" },
                    ].map((moment, i) => (
                      <button key={i} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 transition-all text-left group border border-slate-800/50">
                        <span className="text-xs font-black text-red-500 w-12">{moment.time}</span>
                        <span className="text-xs font-bold text-slate-300 group-hover:text-white flex-1">{moment.event}</span>
                        <Play size={12} className="text-slate-600 group-hover:text-red-500 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="pt-8 border-t border-slate-800">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Match Stats</h4>
                  </div>
                  <div className="space-y-6">
                    {[
                      { label: "Possession", home: "54%", away: "46%", homeVal: 54 },
                      { label: "Shots", home: "12", away: "8", homeVal: 60 },
                      { label: "On Target", home: "5", away: "3", homeVal: 62 },
                      { label: "Corners", home: "7", away: "4", homeVal: 63 },
                    ].map((stat, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                          <span className="text-white">{stat.home}</span>
                          <span>{stat.label}</span>
                          <span className="text-white">{stat.away}</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                          <div className="h-full bg-red-600" style={{ width: `${stat.homeVal}%` }}></div>
                          <div className="h-full bg-blue-600" style={{ width: `${100 - stat.homeVal}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="max-w-7xl mx-auto p-6 flex items-center justify-between bg-slate-900/50 backdrop-blur-md border-t border-slate-800">
              <div className="flex items-center gap-4">
                <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-600/20">
                  <Tv size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black italic uppercase tracking-tight">{selectedReplay.matchName}</h3>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Full Match Replay • {selectedReplay.league}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedReplay(null)}
                className="p-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-2xl transition-all"
              >
                <X size={24} />
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};
