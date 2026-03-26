import React, { useState, useEffect } from 'react';
import { Match, ChatMessage, VoteData, MatchStatistics } from '../types';
import { Send, Share2, MessageCircle, Trophy, BarChart2, ChevronDown, ChevronUp, Clock, Zap, AlertTriangle, Repeat, Play, Video, Youtube } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getMatchStatistics } from '../services/api';
import { MatchEvent } from '../types';

import { LiveMatchTracker } from './LiveMatchTracker';

interface MatchCardProps {
  match: Match;
  onPredict?: (match: Match) => void;
  onWatchReplay?: () => void;
  onWatchHighlights?: (match: Match) => void;
  onOpenScoutFeed?: (match: Match) => void;
  onLtbChannelClick?: (url?: string) => void;
  isPending?: boolean;
  isScoutMode?: boolean;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onPredict, onWatchReplay, onWatchHighlights, onOpenScoutFeed, onLtbChannelClick, isPending, isScoutMode }) => {
  const [showChat, setShowChat] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showLive, setShowLive] = useState(match.status.type === 'inprogress');
  const [stats, setStats] = useState<MatchStatistics | null>(match.statistics || null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [votes, setVotes] = useState<VoteData>({ home: 10, draw: 5, away: 8 });
  const [hasVoted, setHasVoted] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  useEffect(() => {
    // Load chat from localStorage
    const savedChat = localStorage.getItem(`chat_${match.id}`);
    if (savedChat) {
      setMessages(JSON.parse(savedChat));
    }

    // Load votes from localStorage
    const savedVotes = localStorage.getItem(`votes_${match.id}`);
    if (savedVotes) {
      setVotes(JSON.parse(savedVotes));
      setHasVoted(true);
    }
  }, [match.id]);

  const fetchStats = async () => {
    if (stats || loadingStats) return;
    setLoadingStats(true);
    try {
      const data = await getMatchStatistics(match.id);
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const toggleStats = () => {
    if (!showStats) fetchStats();
    setShowStats(!showStats);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      user: "Fan",
      text: newMessage,
      timestamp: Date.now()
    };
    const updatedMessages = [...messages, msg];
    setMessages(updatedMessages);
    localStorage.setItem(`chat_${match.id}`, JSON.stringify(updatedMessages));
    setNewMessage('');
  };

  const handleVote = (choice: keyof VoteData) => {
    if (hasVoted) return;
    const updatedVotes = { ...votes, [choice]: votes[choice] + 1 };
    setVotes(updatedVotes);
    setHasVoted(true);
    localStorage.setItem(`votes_${match.id}`, JSON.stringify(updatedVotes));
  };

  const shareMatch = () => {
    const text = `Watch ${match.home_team.name} vs ${match.away_team.name} live on LTB Sports! ${window.location.href}`;
    navigator.clipboard.writeText(text);
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 3000);
  };

  const totalVotes = votes.home + votes.draw + votes.away;
  const getPercentage = (val: number) => Math.round((val / totalVotes) * 100);

  const [viewMode, setViewMode] = useState<'tracker' | 'video'>('tracker');

  const broadcasters = [
    { name: 'DSTV Stream', url: 'https://www.dstv.com/en-za/stream', color: 'bg-blue-800' },
    { name: 'Sky Sports', url: 'https://www.skysports.com/watch', color: 'bg-red-600' }
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800 rounded-2xl overflow-hidden shadow-xl border border-slate-700 hover:border-red-500/50 transition-all relative"
    >
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2"
          >
            <Share2 size={12} /> Link Copied!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-slate-900/50 p-3 flex justify-between items-center border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-all ${
            match.status.type === 'inprogress' 
              ? 'bg-red-600/10 text-red-500 border-red-500/20 animate-pulse' 
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              match.status.type === 'inprogress' ? 'bg-red-500 animate-ping' : 'bg-slate-500'
            }`}></span>
            <span className="text-[10px] font-black uppercase tracking-widest">
              {match.status.type === 'inprogress' ? 'LIVE' : match.status.description}
            </span>
            {match.status.type === 'inprogress' && (
              <span className="text-[10px] font-bold ml-1">{match.status.description}</span>
            )}
          </div>
          {isScoutMode && match.status.type === 'inprogress' && (
            <div className="flex items-center gap-1.5 bg-green-600/10 text-green-500 px-2 py-0.5 rounded-full border border-green-500/20">
              <Zap size={10} fill="currentColor" className="animate-bounce" />
              <span className="text-[8px] font-black uppercase tracking-widest">Scout Active</span>
            </div>
          )}
        </div>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {match.tournament.name}
        </span>
      </div>

      <div className="p-6 flex items-center justify-between gap-4">
        <div className="flex-1 flex flex-col items-center gap-2 text-center">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center p-2 shadow-inner">
            <img
              src={`https://api.sofascore.app/api/v1/team/${match.home_team.id}/image`}
              alt={match.home_team.name}
              className="w-12 h-12 object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => (e.currentTarget.src = "https://picsum.photos/seed/football/100/100")}
            />
          </div>
          <span className="font-bold text-sm sm:text-base">{match.home_team.name}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="text-4xl font-black tracking-tighter flex items-center gap-2">
            <span>{match.home_score.current}</span>
            <span className="text-slate-600">-</span>
            <span>{match.away_score.current}</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Score</span>
        </div>

        <div className="flex-1 flex flex-col items-center gap-2 text-center">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center p-2 shadow-inner">
            <img
              src={`https://api.sofascore.app/api/v1/team/${match.away_team.id}/image`}
              alt={match.away_team.name}
              className="w-12 h-12 object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => (e.currentTarget.src = "https://picsum.photos/seed/football/100/100")}
            />
          </div>
          <span className="font-bold text-sm sm:text-base">{match.away_team.name}</span>
        </div>
      </div>

      <div className="px-6 pb-6 space-y-4">
        <AnimatePresence>
          {showLive && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4 space-y-4"
            >
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700 w-fit">
                <button 
                  onClick={() => setViewMode('tracker')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'tracker' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}
                >
                  Live Tracker
                </button>
                <button 
                  onClick={() => setViewMode('video')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'video' ? 'bg-red-600 text-white' : 'text-slate-500'}`}
                >
                  Video Stream
                </button>
              </div>

              <div className="relative group">
                {viewMode === 'tracker' ? (
                  <LiveMatchTracker match={match} />
                ) : (
                  <div className="aspect-video rounded-2xl overflow-hidden bg-black border border-slate-700 relative">
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1&rel=0`}
                      allowFullScreen
                      title="Live Match Stream"
                    ></iframe>
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                      Live Stream
                    </div>
                  </div>
                )}
                <button 
                  onClick={() => setShowLive(false)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md transition-all z-30"
                >
                  <ChevronUp size={16} />
                </button>
              </div>

              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Official Broadcasters</span>
                  <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Available Now</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {broadcasters.map(b => (
                    <a
                      key={b.name}
                      href={b.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${b.color} hover:opacity-90 text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-center transition-all flex items-center justify-center gap-2`}
                    >
                      <Play size={10} fill="currentColor" /> {b.name}
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2">
          {match.status.type === 'inprogress' ? (
            <button
              onClick={() => setShowLive(!showLive)}
              className={`flex-[2] flex items-center justify-center gap-2 py-2 rounded-xl transition-all font-black text-xs shadow-lg active:scale-95 ${
                showLive ? 'bg-white text-red-600' : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
              }`}
            >
              <Play size={14} fill={showLive ? "transparent" : "currentColor"} /> 
              {showLive ? 'CLOSE STREAM' : 'WATCH LIVE'}
            </button>
          ) : match.status.type === 'finished' ? (
            <div className="flex-1 flex gap-2">
              <button
                onClick={onWatchReplay}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl transition-colors font-bold text-xs"
              >
                <Play size={14} /> Full Replay
              </button>
              <button
                onClick={() => onWatchHighlights?.(match)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all font-bold text-xs ${
                  isPending ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                <Video size={14} /> {isPending ? 'Watching...' : 'Highlights'}
              </button>
            </div>
          ) : (
            <button
              onClick={shareMatch}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 py-2 rounded-xl transition-colors font-bold text-xs"
            >
              <Share2 size={14} /> Share
            </button>
          )}
          <button
            onClick={() => setShowChat(!showChat)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-colors font-bold text-xs ${
              showChat ? 'bg-red-600 text-white' : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            <MessageCircle size={14} /> Fan Zone
          </button>
          <button
            onClick={toggleStats}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-colors font-bold text-xs ${
              showStats ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            <BarChart2 size={14} /> Stats
          </button>
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-colors font-bold text-xs ${
              showTimeline ? 'bg-emerald-600 text-white' : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            <Clock size={14} /> Timeline
          </button>
          <button
            onClick={() => onPredict?.(match)}
            className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black py-2 rounded-xl transition-colors font-bold text-xs"
          >
            <Trophy size={14} /> Predict
          </button>
          {isScoutMode && match.status.type === 'inprogress' && (
            <>
              <button
                onClick={() => onLtbChannelClick?.("https://www.youtube.com/@LTBLIVESPORTSTV")}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl transition-colors font-bold text-xs animate-pulse"
              >
                <Zap size={14} /> Scout Feed
              </button>
              <button
                onClick={() => onLtbChannelClick?.("https://www.youtube.com/@LTBDailyTips")}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl transition-colors font-bold text-xs border border-slate-700"
              >
                <Youtube size={14} className="text-red-500" /> Tips
              </button>
            </>
          )}
        </div>

        <AnimatePresence>
          {showTimeline && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-slate-900 rounded-2xl border border-slate-700 p-4 space-y-4">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <span>Match Timeline</span>
                  <span className="text-emerald-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    Live Events
                  </span>
                </div>

                {match.events && match.events.length > 0 ? (
                  <div className="relative pl-4 space-y-6 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                    {match.events.sort((a, b) => a.time.elapsed - b.time.elapsed).map((event) => (
                      <div key={event.id} className="relative flex items-start gap-4">
                        <div className={`z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-lg ${
                          event.type === 'Goal' ? 'bg-emerald-500' : 
                          event.type === 'Card' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}>
                          {event.type === 'Goal' && <Zap size={14} className="text-white" />}
                          {event.type === 'Card' && <AlertTriangle size={14} className="text-black" />}
                          {event.type === 'subst' && <Repeat size={14} className="text-white" />}
                        </div>
                        <div className="flex-1 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black text-white bg-slate-700 px-2 py-0.5 rounded-full">{event.time.elapsed}'</span>
                            <span className={`text-[8px] font-bold uppercase tracking-widest ${
                              event.team.id === match.home_team.id ? 'text-red-400' : 'text-slate-400'
                            }`}>
                              {event.team.name}
                            </span>
                          </div>
                          <h4 className="text-xs font-black text-white uppercase italic">{event.player.name}</h4>
                          {event.detail && (
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">{event.detail}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-2">
                    <div className="w-12 h-12 bg-slate-800 rounded-full mx-auto flex items-center justify-center text-slate-600">
                      <Clock size={20} />
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Waiting for match events...</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-slate-900 rounded-2xl border border-slate-700 p-4 space-y-4">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <span>Match Statistics</span>
                  {loadingStats && <span className="animate-pulse text-blue-500">Loading...</span>}
                </div>
                
                {stats && (
                  <div className="space-y-4">
                    <StatRow label="Possession" home={stats.possession.home} away={stats.possession.away} suffix="%" />
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                      <StatRow label="Shots on Target" home={stats.shotsOnTarget.home} away={stats.shotsOnTarget.away} />
                      <StatRow label="Total Shots" home={stats.totalShots.home} away={stats.totalShots.away} />
                      <StatRow label="Corner Kicks" home={stats.corners.home} away={stats.corners.away} />
                      <StatRow label="Offsides" home={stats.offsides.home} away={stats.offsides.away} />
                      <StatRow label="Fouls" home={stats.fouls.home} away={stats.fouls.away} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="flex items-center justify-between bg-slate-800 p-3 rounded-xl border border-slate-700">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-4 bg-yellow-500 rounded-sm shadow-sm"></div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cards</span>
                        </div>
                        <div className="flex gap-4 text-xs font-black">
                          <div className="flex items-center gap-1.5">
                            <span className="text-yellow-500">{stats.yellowCards.home}</span>
                            <span className="text-red-500">{stats.redCards.home}</span>
                          </div>
                          <span className="text-slate-700">|</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-yellow-500">{stats.yellowCards.away}</span>
                            <span className="text-red-500">{stats.redCards.away}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center bg-slate-800 p-3 rounded-xl border border-slate-700 text-[10px] font-black text-blue-500 uppercase tracking-widest">
                        <span className="animate-pulse mr-2">●</span> Live Data
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!hasVoted ? (
          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
            <p className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
              <Trophy size={14} className="text-yellow-500" /> WHO WILL WIN?
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleVote('home')}
                className="bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-[10px] font-bold border border-slate-700 transition-all"
              >
                {match.home_team.name}
              </button>
              <button
                onClick={() => handleVote('draw')}
                className="bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-[10px] font-bold border border-slate-700 transition-all"
              >
                Draw
              </button>
              <button
                onClick={() => handleVote('away')}
                className="bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-[10px] font-bold border border-slate-700 transition-all"
              >
                {match.away_team.name}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
            <p className="text-xs font-bold text-slate-400 mb-3">VOTING RESULTS</p>
            <div className="space-y-2">
              <div className="relative h-6 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-red-600 transition-all duration-1000"
                  style={{ width: `${getPercentage(votes.home)}%` }}
                ></div>
                <span className="absolute inset-0 flex items-center px-3 text-[10px] font-bold">
                  {match.home_team.name}: {getPercentage(votes.home)}%
                </span>
              </div>
              <div className="relative h-6 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-slate-600 transition-all duration-1000"
                  style={{ width: `${getPercentage(votes.draw)}%` }}
                ></div>
                <span className="absolute inset-0 flex items-center px-3 text-[10px] font-bold">
                  Draw: {getPercentage(votes.draw)}%
                </span>
              </div>
              <div className="relative h-6 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-slate-500 transition-all duration-1000"
                  style={{ width: `${getPercentage(votes.away)}%` }}
                ></div>
                <span className="absolute inset-0 flex items-center px-3 text-[10px] font-bold">
                  {match.away_team.name}: {getPercentage(votes.away)}%
                </span>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-slate-900 rounded-2xl border border-slate-700 flex flex-col h-64">
                <div className="p-3 border-b border-slate-700 text-[10px] font-bold text-slate-500 uppercase">
                  Live Chat
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                  {messages.length === 0 ? (
                    <p className="text-center text-slate-600 text-xs italic">No messages yet. Start the conversation!</p>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-red-500">{msg.user}</span>
                        <p className="text-xs bg-slate-800 p-2 rounded-lg inline-block self-start border border-slate-700">
                          {msg.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-slate-700 flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-red-600 p-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

interface StatRowProps {
  label: string;
  home: number;
  away: number;
  suffix?: string;
}

const StatRow: React.FC<StatRowProps> = ({ label, home, away, suffix = "" }) => {
  const total = home + away || 1;
  const homePercent = (home / total) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
        <span className="text-white">{home}{suffix}</span>
        <span className="text-slate-500 font-bold">{label}</span>
        <span className="text-white">{away}{suffix}</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-1000 shadow-[0_0_8px_rgba(220,38,38,0.4)]" 
          style={{ width: `${homePercent}%` }}
        ></div>
        <div 
          className="h-full bg-gradient-to-l from-slate-600 to-slate-500 transition-all duration-1000" 
          style={{ width: `${100 - homePercent}%` }}
        ></div>
      </div>
    </div>
  );
};
