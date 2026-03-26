import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { NewsTicker } from './components/NewsTicker';
import { MatchCard } from './components/MatchCard';
import { StandingsTable } from './components/StandingsTable';
import { WelcomeModal } from './components/WelcomeModal';
import { ProfileModal } from './components/ProfileModal';
import { NotificationCenter } from './components/NotificationCenter';
import { PredictionModal } from './components/PredictionModal';
import { HighlightsSection } from './components/HighlightsSection';
import { LoginModal } from './components/LoginModal';
import { SupportCard } from './components/SupportCard';
import { Footer } from './components/Footer';
import { SocialFeed } from './components/SocialFeed';
import { PollWidget } from './components/PollWidget';
import { AdModal } from './components/AdModal';
import { VoiceNoteRecorder } from './components/VoiceNoteRecorder';
import { VoiceNoteItem } from './components/VoiceNoteItem';
import { FlashscoreLiveFeed } from './components/FlashscoreLiveFeed';
import { getLiveMatches, getStandings, getRecentMatches, getScoreBatHighlights, getScoutEvents, getLiveMatchesRapid, getSeasonStatistics } from './services/api';
import { Match, Standing, UserProfile, NotificationSettings, AppNotification, Poll, VoiceNote, ScoreBatHighlight, Highlight } from './types';
import { Search, Trophy, Tv, Bell, BellOff, Clock, Play, User, Youtube, ExternalLink, X, Mic, Sparkles, Zap, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const App: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isPredictionOpen, setIsPredictionOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('is_logged_in') === 'true';
  });
  const [selectedMatchForPrediction, setSelectedMatchForPrediction] = useState<Match | null>(null);
  const [selectedStream, setSelectedStream] = useState<{ title: string; thumb: string } | null>(null);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [pendingStream, setPendingStream] = useState<{ title: string; thumb: string } | null>(null);
  const [pendingHighlightsMatch, setPendingHighlightsMatch] = useState<Match | null>(null);
  const [pendingHighlight, setPendingHighlight] = useState<any | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<any | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeague, setSelectedLeague] = useState(39);
  const [liveFilter, setLiveFilter] = useState<'all' | 'live' | 'finished'>('all');
  const [matchLeagueFilter, setMatchLeagueFilter] = useState<string>('All');
  const [liveOnlyFilter, setLiveOnlyFilter] = useState(false);
  const [goalAlerts, setGoalAlerts] = useState(true);
  const [currentSection, setCurrentSection] = useState<'live' | 'highlights' | 'tv' | 'streams' | 'community' | 'hub'>('live');
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [selectedMatchForHub, setSelectedMatchForHub] = useState<Match | null>(null);
  const [hubVideoUrl, setHubVideoUrl] = useState<string>('');
  const [hubStatus, setHubStatus] = useState<string>('Select a live match to see if highlights are ready.');
  const [pendingHighlights, setPendingHighlights] = useState<Match[]>(() => {
    const saved = localStorage.getItem('pending_highlights');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing pending highlights:", e);
      }
    }
    return [];
  });
  const [pollerStatus, setPollerStatus] = useState('');
  const [processedEventIds, setProcessedEventIds] = useState<Set<string>>(new Set());
  const [seasonStats, setSeasonStats] = useState<any>(null);
  const [isScoutMode, setIsScoutMode] = useState(true);
  const [isGoalFlash, setIsGoalFlash] = useState(false);
  const [scoutAlert, setScoutAlert] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const prevMatchesRef = React.useRef<Match[]>([]);
  const [selectedMatchForDetails, setSelectedMatchForDetails] = useState<Match | null>(null);
  const [commentaryEvents, setCommentaryEvents] = useState<any[]>([]);
  const channels = [
    { 
      name: 'LTB LIVE Official', 
      desc: 'Main Highlights & Tips', 
      playlistId: 'PL6537rKUWXWcr-0aG-H-CjIiaItbe7nlu', 
      url: 'https://www.youtube.com/@LTBLIVESPORTSTV/playlists', 
      featured: true,
      type: 'youtube',
      schedule: [
        { time: '14:00', title: 'Live: Match Preview', status: 'Live' },
        { time: '16:00', title: 'LTB LIVE Highlights', status: 'Upcoming' },
        { time: '18:30', title: 'Top 10 Goals', status: 'Upcoming' },
        { time: '20:00', title: 'Fan Q&A', status: 'Upcoming' },
      ]
    },
    { 
      name: 'LTB LIVE Replays', 
      desc: 'Your Custom Highlights', 
      playlistId: 'PL218E937FB28BB3D1', 
      url: 'https://www.youtube.com/@LTBLIVESPORTSTV',
      type: 'youtube',
      schedule: [
        { time: '14:00', title: 'Custom Highlight #1', status: 'Live' },
        { time: '16:00', title: 'Custom Highlight #2', status: 'Upcoming' },
      ]
    },
    { 
      name: 'LTB LIVE Strategy', 
      desc: 'Expert Betting Analysis', 
      playlistId: 'PLm_A6J6J8W_L_Z_Y_Z_Y_Z_Y_Z_Y_Z_Y', 
      url: 'https://www.youtube.com/@LTBLIVESPORTSTV',
      type: 'youtube',
      schedule: [
        { time: '14:00', title: 'The Betting Edge', status: 'Live' },
        { time: '16:00', title: 'Weekend Predictions', status: 'Upcoming' },
        { time: '18:30', title: 'Banker of the Day', status: 'Upcoming' },
        { time: '20:00', title: 'Strategy Workshop', status: 'Upcoming' },
      ]
    },
    { 
      name: 'LTB Community', 
      desc: 'Fan Discussions & News', 
      playlistId: '', 
      url: 'https://africa.espn.com/football/league/_/name/eng.1',
      type: 'social',
      schedule: [
        { time: '14:00', title: 'Community Talk', status: 'Live' },
        { time: '16:00', title: 'Fan Phone-In', status: 'Upcoming' },
        { time: '18:30', title: 'LTB News Update', status: 'Upcoming' },
        { time: '20:00', title: 'Poll Results', status: 'Upcoming' },
      ]
    },
  ];

  const [tvChannel, setTvChannel] = useState(channels[0]);

  const [activePoll, setActivePoll] = useState<Poll>({
    id: 'p1',
    question: 'Who will win the Premier League this season?',
    options: [
      { id: '1', text: 'Manchester City', votes: 450 },
      { id: '2', text: 'Arsenal', votes: 380 },
      { id: '3', text: 'Liverpool', votes: 310 },
      { id: '4', text: 'Chelsea', votes: 120 },
    ],
    totalVotes: 1260,
    hasVoted: false
  });

  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [hasWatchedAd, setHasWatchedAd] = useState(false);

  // User State
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing profile:", e);
      }
    }
    return {
      username: 'GuestFan',
      bio: 'Football is life! ⚽',
      profilePic: '',
      favoriteTeam: 'None',
      points: 1250,
      level: 5
    };
  });

  // Save profile to localStorage
  useEffect(() => {
    localStorage.setItem('user_profile', JSON.stringify(profile));
  }, [profile]);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('notification_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing notification settings:", e);
      }
    }
    return {
      goalAlerts: true,
      matchReminders: true,
      newsUpdates: true,
      pushEnabled: false
    };
  });

  // Save login state to localStorage
  useEffect(() => {
    localStorage.setItem('is_logged_in', isLoggedIn.toString());
  }, [isLoggedIn]);

  const handleLogin = (username: string) => {
    setProfile(prev => ({ ...prev, username }));
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setProfile({
      username: 'GuestFan',
      bio: 'Football is life! ⚽',
      profilePic: '',
      favoriteTeam: 'None',
      points: 1250,
      level: 5
    });
  };

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [lastStandingsUpdate, setLastStandingsUpdate] = useState<Date | null>(null);
  const lastFetchedLeague = React.useRef<number | null>(null);
  const [chatMessages, setChatMessages] = useState([
    { user: 'SportsFan99', msg: 'That goal was insane! 🔥', color: 'text-blue-400' },
    { user: 'BetMaster', msg: 'LTB tips are hitting today! 💰', color: 'text-green-400' },
    { user: 'LagosKing', msg: 'Who else is watching from Nigeria? 🇳🇬', color: 'text-yellow-400' },
    { user: 'FootballLover', msg: 'Predictions for the next match?', color: 'text-purple-400' },
    { user: 'LTB_Mod', msg: 'Welcome everyone! Stay tuned for more tips.', color: 'text-red-500' },
  ]);
  const [currentChatMessage, setCurrentChatMessage] = useState('');

  // Save pending highlights to localStorage
  useEffect(() => {
    localStorage.setItem('pending_highlights', JSON.stringify(pendingHighlights));
  }, [pendingHighlights]);

  // Poller for highlights
  useEffect(() => {
    if (pendingHighlights.length === 0) {
      setPollerStatus('');
      return;
    }

    setPollerStatus(`Watching ${pendingHighlights.length} matches for new highlights...`);

    const interval = setInterval(async () => {
      const highlights = await getScoreBatHighlights();
      
      setPendingHighlights(prev => {
        const stillPending = prev.filter(match => {
          const found = highlights.find(h => 
            h.title.toLowerCase().includes(match.home_team.name.toLowerCase()) && 
            h.title.toLowerCase().includes(match.away_team.name.toLowerCase())
          );
          
          if (found) {
            // Found!
            const notification: AppNotification = {
              id: Date.now().toString(),
              title: 'Highlights Found!',
              message: `New highlights available for ${match.home_team.name} vs ${match.away_team.name}`,
              type: 'news',
              timestamp: Date.now(),
              read: false
            };
            setNotifications(prev => [notification, ...prev]);
            return false; // Remove from pending
          }
          return true;
        });
        return stillPending;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [pendingHighlights]);

  // High-Speed Scout Poller
  useEffect(() => {
    if (!isScoutMode) return;

    const liveMatches = matches.filter(m => m.status.type === 'inprogress');
    if (liveMatches.length === 0) return;

    const apiKey = (import.meta as any).env.VITE_RAPID_API_KEY || "0549520c16msha2b6cad21800869p1164e0jsn6b42d4827889";

    const interval = setInterval(async () => {
      for (const match of liveMatches) {
        try {
          const events = await getScoutEvents(apiKey, match.id);
          if (events && events.length > 0) {
            const latestEvent = events[events.length - 1];
            // Create a unique ID for the event to avoid duplicate processing
            const eventId = `${match.id}-${latestEvent.time?.elapsed}-${latestEvent.type}-${latestEvent.detail || ''}-${latestEvent.player?.id || latestEvent.player?.name}`;

            if (!processedEventIds.has(eventId)) {
              setProcessedEventIds(prev => {
                const next = new Set(prev);
                next.add(eventId);
                return next;
              });

              if (latestEvent.type === "Goal") {
                // Trigger Visual Alert
                setScoutAlert(`GOAL! ${latestEvent.player?.name || 'Someone'} has scored for ${latestEvent.team?.name}!`);
                
                // Optimistic Score Update
                setMatches(prev => prev.map(m => {
                  if (m.id === match.id) {
                    const isHome = latestEvent.team?.id === m.home_team.id;
                    return {
                      ...m,
                      home_score: { current: isHome ? m.home_score.current + 1 : m.home_score.current },
                      away_score: { current: !isHome ? m.away_score.current + 1 : m.away_score.current }
                    };
                  }
                  return m;
                }));

                // Notification
                addNotification('SCOUT ALERT: Goal!', `${latestEvent.player?.name || 'Someone'} scored for ${latestEvent.team?.name} in ${match.home_team.name} vs ${match.away_team.name}`, 'goal');

                // Clear alert after 5s
                setTimeout(() => setScoutAlert(null), 5000);
              }
            }
          }
        } catch (error) {
          console.error("Scout Poller Error:", error);
        }
      }
    }, 15000); // Poll every 15s

    return () => clearInterval(interval);
  }, [matches, isScoutMode, processedEventIds]);

  const handleSendMessage = () => {
    if (!currentChatMessage.trim()) return;
    
    const newMessage = {
      user: profile.username,
      msg: currentChatMessage,
      color: 'text-white'
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    setCurrentChatMessage('');
    
    // Auto-scroll logic could be added here if needed
  };

  const handleWatchHighlights = async (match: Match) => {
    setPendingHighlightsMatch(match);
    setIsAdModalOpen(true);
  };

  const executeHighlights = async (match: Match) => {
    // Try to find highlights
    const highlights = await getScoreBatHighlights();
    const found = highlights.find(h => 
      h.title.toLowerCase().includes(match.home_team.name.toLowerCase()) && 
      h.title.toLowerCase().includes(match.away_team.name.toLowerCase())
    );

    if (found) {
      const mapped: Highlight = {
        id: 'found-' + match.id,
        matchName: found.title,
        date: new Date(found.date).toLocaleDateString(),
        duration: 'Highlights',
        thumbnail: found.thumbnail,
        videoUrl: '',
        league: found.competition,
        embed: found.videos[0]?.embed
      };
      setActiveHighlight(mapped);
      setCurrentSection('highlights');
      addNotification('Highlights Found!', `Playing highlights for ${found.title}`, 'news');
    } else {
      // Not found, add to poller
      if (!pendingHighlights.find(m => m.id === match.id)) {
        setPendingHighlights(prev => [...prev, match]);
        addNotification('Match Added to Poller', `We'll notify you when highlights for ${match.home_team.name} vs ${match.away_team.name} are available.`, 'system');
      }
    }
  };

  const handleHubMatchSelect = async (match: Match) => {
    setSelectedMatchForHub(match);
    setHubStatus("Checking for latest highlights...");
    setHubVideoUrl("");

    try {
      const highlights = await getScoreBatHighlights();
      const home = match.home_team.name.toLowerCase();
      const away = match.away_team.name.toLowerCase();
      const found = highlights.find(h => h.title.toLowerCase().includes(home) || h.title.toLowerCase().includes(away));

      if (found && found.videos.length > 0) {
        const embed = found.videos[0].embed;
        const matchUrl = embed.match(/src=['"]([^'"]+)['"]/);
        if (matchUrl) {
          setHubVideoUrl(matchUrl[1]);
          setHubStatus("Playing Highlights");
        } else {
          setHubStatus("Match is live! Highlights will appear here after the game.");
        }
      } else {
        setHubStatus("Match is live! Highlights will appear here after the game.");
      }
    } catch (error) {
      console.error("Hub Highlight Error:", error);
      setHubStatus("Error checking highlights.");
    }
  };

  const addNotification = useCallback((title: string, message: string, type: AppNotification['type']) => {
    const newNotif: AppNotification = {
      id: Date.now().toString(),
      title,
      message,
      type,
      timestamp: Date.now(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 20));
    
    // Play sound if goal
    if (type === 'goal' && notificationSettings.goalAlerts) {
      const audio = document.getElementById('goalSound') as HTMLAudioElement;
      if (audio) audio.play().catch(() => {});
    }
  }, [notificationSettings.goalAlerts]);

  const handleVote = (optionId: string) => {
    setActivePoll(prev => {
      const updatedOptions = prev.options.map(opt => 
        opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
      );
      return {
        ...prev,
        options: updatedOptions,
        totalVotes: prev.totalVotes + 1,
        hasVoted: true,
        votedOptionId: optionId
      };
    });
    
    addNotification('Poll Vote Cast', 'Your vote has been recorded! Check the live results.', 'system');
  };

  const handleSendVoiceNote = (duration: string, audioUrl: string) => {
    const newNote: VoiceNote = {
      id: Date.now().toString(),
      userId: 'current-user',
      username: profile.username,
      userPic: profile.profilePic || `https://picsum.photos/seed/${profile.username}/100/100`,
      duration,
      timestamp: Date.now(),
      likes: 0,
      audioUrl
    };
    setVoiceNotes(prev => [newNote, ...prev]);
    addNotification('Voice Note Posted', 'Your message is now live in the Fan Phone-In section!', 'system');
  };

  const playGoalSound = useCallback(() => {
    const audio = new Audio('https://www.soundjay.com/buttons/beep-07.mp3');
    audio.play().catch(e => console.log("Audio play blocked:", e));
  }, []);

  const fetchData = useCallback(async (isManual: boolean = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const apiKey = (import.meta as any).env.VITE_RAPID_API_KEY || "0549520c16msha2b6cad21800869p1164e0jsn6b42d4827889";
      
      const [liveMatches, recentMatchesData] = await Promise.all([
        isScoutMode ? getLiveMatchesRapid(apiKey, selectedLeague) : getLiveMatches(),
        getRecentMatches()
      ]);

      // Only update standings every 5th refresh (or 3rd in Scout Mode) to save API credits
      const standingsRefreshRate = isScoutMode ? 3 : 5;
      const shouldFetchStandings = refreshCount % standingsRefreshRate === 0 || isManual || lastFetchedLeague.current !== selectedLeague;
      
      if (shouldFetchStandings) {
        const [leagueStandings, stats] = await Promise.all([
          getStandings(selectedLeague),
          getSeasonStatistics(selectedLeague)
        ]);
        setStandings(leagueStandings);
        setSeasonStats(stats);
        setLastStandingsUpdate(new Date());
        lastFetchedLeague.current = selectedLeague;
      }
      setRefreshCount(prev => prev + 1);
      
      // Check for new goals (simulation)
      if (prevMatchesRef.current.length > 0 && liveMatches.length > 0) {
        liveMatches.forEach(newMatch => {
          const oldMatch = prevMatchesRef.current.find(m => m.id === newMatch.id);
          if (oldMatch && (newMatch.home_score.current > oldMatch.home_score.current || newMatch.away_score.current > oldMatch.away_score.current)) {
            setIsGoalFlash(true);
            playGoalSound();
            setTimeout(() => setIsGoalFlash(false), 3000);
            
            addNotification(
              'GOAL!!! ⚽',
              `${newMatch.home_team.name} ${newMatch.home_score.current} - ${newMatch.away_score.current} ${newMatch.away_team.name}`,
              'goal'
            );
          }
        });
      }

      prevMatchesRef.current = liveMatches;
      setMatches(liveMatches);
      setRecentMatches(recentMatchesData);
      setLastUpdated(new Date());
      
      if (isManual) {
        addNotification('Data Updated', 'Live scores and standings have been refreshed.', 'system');
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      if (isManual) {
        addNotification('Refresh Failed', 'Could not update live data. Please check your connection.', 'system');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedLeague, addNotification, isScoutMode, refreshCount, playGoalSound]);

  useEffect(() => {
    fetchData();
    const intervalTime = isScoutMode ? 20000 : 60000;
    const interval = setInterval(fetchData, intervalTime);
    return () => clearInterval(interval);
  }, [fetchData, isScoutMode]);

  // Commentary Poller
  useEffect(() => {
    if (!selectedMatchForDetails || !isScoutMode) {
      setCommentaryEvents([]);
      return;
    }

    const fetchCommentary = async () => {
      const apiKey = (import.meta as any).env.VITE_RAPID_API_KEY || "0549520c16msha2b6cad21800869p1164e0jsn6b42d4827889";
      const events = await getScoutEvents(apiKey, selectedMatchForDetails.id);
      setCommentaryEvents(events.reverse());
    };

    fetchCommentary();
    const interval = setInterval(fetchCommentary, 15000);
    return () => clearInterval(interval);
  }, [selectedMatchForDetails, isScoutMode]);

  useEffect(() => {
    // Load saved data
    const savedProfile = localStorage.getItem('user_profile');
    if (savedProfile) setProfile(JSON.parse(savedProfile));

    const savedSettings = localStorage.getItem('notification_settings');
    if (savedSettings) setNotificationSettings(JSON.parse(savedSettings));

    const savedNotifs = localStorage.getItem('notifications');
    if (savedNotifs) setNotifications(JSON.parse(savedNotifs));

    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setIsWelcomeOpen(true);
    }

    // Simulate a welcome notification
    setTimeout(() => {
      addNotification('Welcome Back!', 'Check out the live scores for today.', 'system');
    }, 2000);
  }, []); // Only on mount

  useEffect(() => {
    localStorage.setItem('user_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('notification_settings', JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const handleCloseWelcome = () => {
    setIsWelcomeOpen(false);
    localStorage.setItem('hasSeenWelcome', 'true');
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('light-mode');
  };

  const handlePredict = (match: Match) => {
    setSelectedMatchForPrediction(match);
    setIsPredictionOpen(true);
  };

  const handleLtbChannelClick = (url: string = "https://www.youtube.com/@LTBDailyTips") => {
    setPendingUrl(url);
    setIsAdModalOpen(true);
  };

  const submitPrediction = (matchId: number, prediction: string) => {
    addNotification(
      'Prediction Locked! 🔒',
      `Your prediction for match #${matchId} has been submitted. Good luck!`,
      'system'
    );
    // Update profile points for participation
    setProfile(prev => ({ ...prev, points: prev.points + 50 }));
  };

  const [selectedSport, setSelectedSport] = useState<'football' | 'american-football'>('football');

  const filteredMatches = matches.filter(match => {
    const matchesSearch = match.home_team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.away_team.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSport = match.sport === selectedSport;
    
    const matchesLeague = matchLeagueFilter === 'All' || 
                         match.tournament.name.includes(matchLeagueFilter) ||
                         (matchLeagueFilter === 'NFL' && match.sport === 'american-football');
    
    const matchesLive = !liveOnlyFilter || match.status.type === 'inprogress';

    return matchesSearch && matchesSport && matchesLeague && matchesLive;
  });

  const leagues = [
    { id: 39, name: "Premier League", icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { id: 140, name: "La Liga", icon: "🇪🇸" },
    { id: 135, name: "Serie A", icon: "🇮🇹" },
    { id: 202, name: "NPFL (Nigeria)", icon: "🇳🇬" },
    { id: 61, name: "Ligue 1", icon: "🇫🇷" },
    { id: 2, name: "Champions League", icon: "🇪🇺" }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Scout Mode Alert Overlay */}
      <AnimatePresence>
        {scoutAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          >
            <div className="absolute inset-0 bg-green-600/20 backdrop-blur-sm animate-pulse"></div>
            <div className="bg-slate-900 border-4 border-green-500 p-8 rounded-[3rem] shadow-[0_0_100px_rgba(34,197,94,0.5)] text-center space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-green-500 animate-loading-bar"></div>
              <div className="flex justify-center">
                <div className="bg-green-500 p-4 rounded-full">
                  <Sparkles size={48} className="text-white animate-bounce" />
                </div>
              </div>
              <h2 className="text-6xl font-black italic uppercase tracking-tighter text-white">
                {scoutAlert.split('!')[0]}!
              </h2>
              <p className="text-2xl font-bold text-green-400 uppercase tracking-widest">
                {scoutAlert.split('!')[1]}
              </p>
              <div className="flex items-center justify-center gap-2 text-slate-500 font-black text-xs uppercase tracking-widest">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                Stadium Scout Data: Faster than TV
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sticky top-0 z-50">
        <NewsTicker matches={matches.filter(m => m.status.type === 'inprogress')} isGoalFlash={isGoalFlash} />
        <Header
          liveCount={matches.length}
          onRefresh={() => fetchData(true)}
          isRefreshing={isRefreshing}
          isDarkMode={isDarkMode}
          toggleTheme={() => setIsDarkMode(!isDarkMode)}
          onOpenProfile={() => {
            if (isLoggedIn) {
              setIsProfileOpen(true);
            } else {
              setIsLoginModalOpen(true);
            }
          }}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onLtbChannelClick={handleLtbChannelClick}
          profile={profile}
          isLoggedIn={isLoggedIn}
          unreadCount={unreadCount}
          currentSection={currentSection}
          onSectionChange={setCurrentSection}
          pendingCount={pendingHighlights.length}
          isScoutMode={isScoutMode}
          toggleScoutMode={() => setIsScoutMode(!isScoutMode)}
          isGoalFlash={isGoalFlash}
          lastUpdated={lastUpdated}
        />
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {currentSection === 'community' && (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-red-600 rounded-full"></div>
                <h2 className="text-3xl font-black tracking-tight uppercase italic">Fan Community Hub</h2>
              </div>
              <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-4 py-2 rounded-full border border-green-500/20">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-xs font-black tracking-widest uppercase">Live Discussions</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black italic uppercase tracking-tight">Community Talk</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Active Now
                    </div>
                  </div>
                  <SocialFeed 
                    user={profile} 
                    isLoggedIn={isLoggedIn}
                    onOpenLogin={() => setIsLoginModalOpen(true)}
                  />
                </div>

                <VoiceNoteRecorder onSend={handleSendVoiceNote} />

                {voiceNotes.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {voiceNotes.map(note => (
                      <VoiceNoteItem key={note.id} note={note} />
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-8">
                <PollWidget poll={activePoll} onVote={handleVote} />

                <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-[2.5rem] p-8 text-white space-y-6 shadow-xl shadow-red-600/20">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Trophy size={32} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-tight">Official LTB Community</h3>
                  <p className="text-white/80 text-sm font-medium leading-relaxed">
                    Join the global conversation on our official community platform. Get the latest news, transfer rumors, and expert analysis.
                  </p>
                  <a 
                    href="https://africa.espn.com/football/league/_/name/eng.1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-white text-red-600 py-4 rounded-2xl font-black text-lg tracking-tight hover:bg-slate-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={20} /> VISIT ESPN AFRICA
                  </a>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black italic uppercase tracking-tight">LTB News Update</h3>
                    <div className="bg-red-600 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter animate-pulse">Breaking</div>
                  </div>
                  <div className="space-y-4">
                    {[
                      { title: 'Transfer Alert: Mbappe to Real Madrid confirmed!', time: '2m ago', category: 'Transfer' },
                      { title: 'Injury Update: Haaland doubtful for weekend clash', time: '15m ago', category: 'Injury' },
                      { title: 'Match Result: NPFL - Enyimba 2-0 Rangers', time: '1h ago', category: 'Result' }
                    ].map((news, i) => (
                      <div key={i} className="group cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[8px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">{news.category}</span>
                          <span className="text-[8px] font-bold text-slate-500 uppercase">{news.time}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-200 group-hover:text-red-500 transition-colors leading-snug">{news.title}</p>
                      </div>
                    ))}
                  </div>
                  <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">View All News</button>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 space-y-6">
                  <h3 className="text-xl font-black italic uppercase tracking-tight">Trending Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {['#NPFL', '#PremierLeague', '#Haaland', '#TransferRumors', '#LTB_Tips', '#ChampionsLeague'].map((tag, i) => (
                      <span key={i} className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-400 hover:border-red-500 hover:text-red-500 cursor-pointer transition-all">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 space-y-6">
                  <h3 className="text-xl font-black italic uppercase tracking-tight">Community Guidelines</h3>
                  <ul className="space-y-4">
                    {[
                      'Be respectful to other fans',
                      'No spam or self-promotion',
                      'Keep it football related',
                      'No hate speech or bullying'
                    ].map((rule, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-400 font-medium">
                        <div className="w-5 h-5 bg-red-600/10 rounded-full flex items-center justify-center text-red-500 mt-0.5">
                          <span className="text-[10px] font-black">{i + 1}</span>
                        </div>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {currentSection === 'hub' && (
          <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] bg-slate-950 rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-2xl">
            {/* Sidebar */}
            <aside className="w-full lg:w-[400px] bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
                <h2 className="text-xl font-black italic uppercase tracking-tight">Live Scores</h2>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">Updating...</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {matches.filter(m => m.status.type === 'inprogress').length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-full mx-auto flex items-center justify-center text-slate-600">
                      <Search size={24} />
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No live matches right now</p>
                  </div>
                ) : (
                  matches.filter(m => m.status.type === 'inprogress').map(match => (
                    <button
                      key={match.id}
                      onClick={() => handleHubMatchSelect(match)}
                      className={`w-full text-left p-5 rounded-2xl transition-all border-2 group relative overflow-hidden ${
                        selectedMatchForHub?.id === match.id 
                          ? 'bg-slate-800 border-red-500 shadow-lg' 
                          : 'bg-slate-800/50 border-transparent hover:border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-2 text-red-500 text-xs font-black uppercase tracking-widest">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            {match.status.description}
                          </span>
                          {isScoutMode && (
                            <div className="flex items-center gap-1.5 bg-green-600/10 text-green-500 px-2 py-0.5 rounded-full border border-green-500/20 animate-pulse">
                              <Zap size={10} fill="currentColor" />
                              <span className="text-[8px] font-black uppercase tracking-widest">Scout</span>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{match.venue || 'Stadium'}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-black italic uppercase tracking-tight text-slate-200">{match.home_team.name}</span>
                          <span className="text-xl font-black text-red-500">{match.home_score.current}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-black italic uppercase tracking-tight text-slate-200">{match.away_team.name}</span>
                          <span className="text-xl font-black text-red-500">{match.away_score.current}</span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </aside>

            {/* Main View */}
            <div className="flex-1 flex flex-col p-8 lg:p-12 items-center justify-center bg-slate-950 relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none"></div>
              
              <div className="w-full max-w-4xl aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-800 relative group">
                {hubVideoUrl ? (
                  <iframe 
                    src={hubVideoUrl} 
                    className="w-full h-full border-none"
                    allowFullScreen
                    title="Match Highlights"
                  ></iframe>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900/50">
                    <div className="text-center space-y-6">
                      <div className="w-24 h-24 bg-slate-800 rounded-full mx-auto flex items-center justify-center text-slate-700 group-hover:scale-110 transition-transform duration-500">
                        <Play size={48} fill="currentColor" />
                      </div>
                      <p className="text-slate-500 font-black uppercase tracking-widest text-sm">Select a match to watch</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-12 text-center space-y-4 max-w-2xl">
                <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
                  {selectedMatchForHub ? `${selectedMatchForHub.home_team.name} vs ${selectedMatchForHub.away_team.name}` : 'Select a Match'}
                </h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">
                  {hubStatus}
                </p>
                {selectedMatchForHub && !hubVideoUrl && (
                  <div className="pt-4">
                    <button 
                      onClick={() => handleWatchHighlights(selectedMatchForHub)}
                      className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-600/20 active:scale-95"
                    >
                      WATCH HIGHLIGHTS
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentSection === 'live' ? (
          <>
            {/* Live Score Feed (Flashscore Style) */}
            <section className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-live-red rounded-full"></div>
                  <h2 className="text-2xl font-black tracking-tight uppercase italic">Live Score Feed</h2>
                  <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 ml-4">
                    <button 
                      onClick={() => {
                        setSelectedSport('football');
                        setMatchLeagueFilter('All');
                      }}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedSport === 'football' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      SOCCER
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedSport('american-football');
                        setMatchLeagueFilter('NFL');
                      }}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedSport === 'american-football' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      NFL
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {(selectedSport === 'football' 
                    ? ['All', 'Premier League', 'La Liga', 'Champions League'] 
                    : ['All', 'NFL', 'NCAA']
                  ).map(league => (
                    <button
                      key={league}
                      onClick={() => setMatchLeagueFilter(league)}
                      className={`px-4 py-2 rounded-xl font-bold text-xs transition-all border ${
                        matchLeagueFilter === league
                          ? (selectedSport === 'football' ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20' : 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20')
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {league === 'All' ? 'ALL MATCHES' : league.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="h-64 bg-slate-900 animate-pulse rounded-3xl border border-slate-800"></div>
              ) : (
                <FlashscoreLiveFeed 
                  matches={filteredMatches} 
                  filter={liveFilter} 
                  onFilterChange={setLiveFilter} 
                  onMatchClick={(match) => {
                    setSelectedMatchForDetails(match);
                    if (match.status.type === 'inprogress') {
                      // Optional: auto-scroll to match center
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }
                  }}
                />
              )}
            </section>

            {/* League Tables Section with Dropdown */}
            <section className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-yellow-500 rounded-full"></div>
                  <h2 className="text-2xl font-black tracking-tight uppercase italic text-yellow-500">GLOBAL FOOTBALL HUB</h2>
                </div>
                <div className="flex items-center gap-4">
                  {lastStandingsUpdate && (
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">
                        Live Sync: {lastStandingsUpdate.toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  <button 
                    onClick={() => fetchData(true)}
                    disabled={isRefreshing}
                    className={`p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                    title="Refresh Standings"
                  >
                    <RefreshCw size={14} className="text-slate-400" />
                  </button>
                  
                  <div className="relative group">
                    <select 
                      value={selectedLeague}
                      onChange={(e) => setSelectedLeague(Number(e.target.value))}
                      className="appearance-none bg-slate-900 text-slate-200 border-2 border-slate-800 rounded-xl px-6 py-3 pr-12 font-black text-xs uppercase tracking-widest focus:outline-none focus:border-yellow-500 transition-all cursor-pointer shadow-2xl hover:bg-slate-800"
                    >
                      {leagues.map(league => (
                        <option key={league.id} value={league.id} className="bg-slate-900 text-white font-black uppercase">
                          {league.icon} {league.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-yellow-500">
                      <Trophy size={14} />
                    </div>
                  </div>
                </div>
              </div>
              
              <StandingsTable
                standings={standings}
                leagueName={leagues.find(l => l.id === selectedLeague)?.name || "League"}
                isRefreshing={isRefreshing}
              />

              {seasonStats && (
                <div className="mt-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-4 bg-yellow-500 rounded-full"></div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Season Insights</h3>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                    {[
                      { label: 'Avg Goals', value: seasonStats.averageGoals?.toFixed(2) || '2.85', icon: '⚽', color: 'text-yellow-500' },
                      { label: 'Home Wins', value: `${seasonStats.homeWinsPercentage?.toFixed(0) || '45'}%`, icon: '🏠', color: 'text-blue-500' },
                      { label: 'Away Wins', value: `${seasonStats.awayWinsPercentage?.toFixed(0) || '32'}%`, icon: '✈️', color: 'text-purple-500' },
                      { label: 'Clean Sheets', value: `${seasonStats.cleanSheetsPercentage?.toFixed(0) || '28'}%`, icon: '🛡️', color: 'text-green-500' },
                      { label: 'BTTS', value: `${seasonStats.bothTeamsToScorePercentage?.toFixed(0) || '52'}%`, icon: '🔄', color: 'text-orange-500' },
                      { label: 'Over 2.5', value: `${seasonStats.over25GoalsPercentage?.toFixed(0) || '58'}%`, icon: '📈', color: 'text-red-500' },
                    ].map((stat, i) => (
                      <motion.div 
                        key={i} 
                        whileHover={{ scale: 1.02 }}
                        className="bg-slate-900/40 border border-slate-800/50 p-4 rounded-2xl flex flex-col items-center justify-center group hover:border-yellow-500/30 transition-all"
                      >
                        <div className={`text-xl mb-2 group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                        <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

            {/* Match Center (MatchCard) */}
            {selectedMatchForDetails && (
              <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-red-600 rounded-full"></div>
                    <h2 className="text-2xl font-black tracking-tight uppercase italic">Match Center</h2>
                  </div>
                  <button 
                    onClick={() => setSelectedMatchForDetails(null)}
                    className="text-slate-500 hover:text-white transition-colors flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"
                  >
                    <X size={16} /> Close Center
                  </button>
                </div>
                <MatchCard 
                  match={selectedMatchForDetails}
                  onPredict={handlePredict}
                  onWatchHighlights={handleWatchHighlights}
                  onLtbChannelClick={handleLtbChannelClick}
                  isScoutMode={isScoutMode}
                />
              </section>
            )}

            {/* Commentary Box (Stadium Feed) */}
            {isScoutMode && selectedMatchForDetails && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black rounded-3xl border border-slate-800 overflow-hidden shadow-2xl mt-8"
              >
                <div className="bg-slate-900/80 p-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-6 bg-green-500 rounded-full animate-pulse"></div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-green-500">
                      Live Stadium Feed: {selectedMatchForDetails.home_team.name} vs {selectedMatchForDetails.away_team.name}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setSelectedMatchForDetails(null)}
                    className="text-slate-500 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="h-[400px] overflow-y-auto p-6 font-mono text-sm custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                  {commentaryEvents.length > 0 ? (
                    <div className="space-y-4">
                      {commentaryEvents.map((event, i) => {
                        let icon = "•";
                        let colorClass = "text-white";
                        let borderClass = "border-slate-800";
                        
                        if (event.type === "Goal") { 
                          icon = "⚽"; 
                          colorClass = "text-green-400";
                          borderClass = "border-green-500/50";
                        }
                        if (event.type === "Card") { 
                          icon = event.detail.includes("Yellow") ? "🟨" : "🟥"; 
                          colorClass = event.detail.includes("Yellow") ? "text-yellow-400" : "text-red-400";
                          borderClass = event.detail.includes("Yellow") ? "border-yellow-500/50" : "border-red-500/50";
                        }
                        if (event.type === "subst") { 
                          icon = "🔄"; 
                          colorClass = "text-blue-400";
                          borderClass = "border-blue-500/50";
                        }

                        return (
                          <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={i} 
                            className={`flex items-start gap-4 p-3 rounded-xl border bg-slate-900/40 backdrop-blur-sm ${borderClass}`}
                          >
                            <span className="text-slate-500 font-black min-w-[40px]">{event.time.elapsed}'</span>
                            <span className={`text-lg ${colorClass}`}>{icon}</span>
                            <div className="flex-1">
                              <span className={`font-black uppercase tracking-tight mr-2 ${colorClass}`}>
                                {event.team.name}:
                              </span>
                              <span className="text-slate-300">
                                {event.detail} ({event.player.name})
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                      <Zap size={48} className="animate-pulse" />
                      <p className="font-black uppercase tracking-widest text-xs">Connecting to stadium data scout...</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            </section>
          </>
        ) : currentSection === 'streams' ? (
          <section className="space-y-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-red-600 rounded-full"></div>
                <h2 className="text-3xl font-black tracking-tight uppercase italic">Live Match Streams</h2>
              </div>
              <div className="bg-red-600/10 text-red-500 px-4 py-2 rounded-full border border-red-500/20 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                <span className="text-xs font-black tracking-widest uppercase">HD Live</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { title: 'Premier League: Arsenal vs Man City', viewers: '1.2M', thumb: 'https://picsum.photos/seed/arsenal/800/450' },
                { title: 'La Liga: Real Madrid vs Barcelona', viewers: '2.5M', thumb: 'https://picsum.photos/seed/elclasico/800/450' },
                { title: 'Champions League: Bayern vs PSG', viewers: '980K', thumb: 'https://picsum.photos/seed/bayern/800/450' },
                { title: 'Serie A: Juventus vs AC Milan', viewers: '450K', thumb: 'https://picsum.photos/seed/juve/800/450' },
                { title: 'Ligue 1: Marseille vs Lyon', viewers: '210K', thumb: 'https://picsum.photos/seed/marseille/800/450' },
                { title: 'NPFL: Enyimba vs Kano Pillars', viewers: '150K', thumb: 'https://picsum.photos/seed/enyimba/800/450' },
              ].map((stream, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -10 }}
                  className="bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-800 group cursor-pointer"
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                      src={stream.thumb} 
                      alt={stream.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-red-600 p-4 rounded-full shadow-2xl shadow-red-600/40">
                        <Play size={32} fill="white" className="text-white" />
                      </div>
                    </div>
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                      Live
                    </div>
                    <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-white/10">
                      {stream.viewers} watching
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <h3 className="text-lg font-black uppercase tracking-tight italic leading-tight group-hover:text-red-500 transition-colors">{stream.title}</h3>
                    <button 
                      onClick={() => {
                        setPendingStream(stream);
                        setIsAdModalOpen(true);
                      }}
                      className="w-full bg-slate-800 hover:bg-red-600 text-white py-3 rounded-2xl font-black text-sm tracking-widest transition-all active:scale-95"
                    >
                      WATCH NOW
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        ) : currentSection === 'highlights' ? (
          <HighlightsSection 
            isTheaterMode={isTheaterMode}
            setIsTheaterMode={setIsTheaterMode}
            pendingHighlights={pendingHighlights}
            setPendingHighlights={setPendingHighlights}
            pollerStatus={pollerStatus}
            onSectionChange={setCurrentSection}
            onWatchHighlight={(h) => {
              setPendingHighlight(h);
              setIsAdModalOpen(true);
            }}
            onLtbChannelClick={handleLtbChannelClick}
            activeHighlight={activeHighlight}
            setActiveHighlight={setActiveHighlight}
          />
        ) : currentSection === 'tv' ? (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                <h2 className="text-3xl font-black tracking-tight uppercase italic">LTB Sports TV</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Signal:</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className={`w-1 h-3 rounded-full ${i <= 4 ? 'bg-green-500' : 'bg-slate-700'}`}></div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-red-600/10 text-red-500 px-4 py-2 rounded-full border border-red-500/20">
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                  <span className="text-xs font-black tracking-widest uppercase">Live Stream</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl border border-slate-800 p-4">
                  <div className="aspect-video rounded-[2rem] overflow-hidden bg-black shadow-inner relative group">
                    <div className="w-full h-full relative">
                      {tvChannel.type === 'social' || tvChannel.type === 'external' ? (
                        <div className="w-full h-full bg-slate-950 p-8 overflow-y-auto custom-scrollbar">
                          <div className="max-w-2xl mx-auto space-y-8">
                            <div className="bg-red-600/10 border border-red-500/20 p-6 rounded-3xl text-center space-y-4">
                              <h4 className="text-xl font-black italic uppercase tracking-tight text-red-500">
                                {tvChannel.type === 'external' ? 'External Highlights Source' : 'LTB Community Hub'}
                              </h4>
                              <p className="text-slate-400 text-sm">
                                {tvChannel.type === 'external' 
                                  ? 'Click below to view the latest match highlights on Hoofoot.' 
                                  : 'Join the conversation with thousands of fans worldwide.'}
                              </p>
                              <a 
                                href={tvChannel.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-black text-xs tracking-widest transition-all active:scale-95"
                              >
                                <ExternalLink size={16} /> {tvChannel.type === 'external' ? 'OPEN HOOFOOT' : 'VISIT OFFICIAL COMMUNITY'}
                              </a>
                            </div>
                            {tvChannel.name === 'LTB LIVE Replays' && (
                              <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-3xl space-y-4">
                                <h4 className="text-lg font-black italic uppercase tracking-tight text-blue-500 flex items-center gap-2">
                                  <Sparkles size={20} /> How to link your channel
                                </h4>
                                <p className="text-slate-400 text-xs leading-relaxed">
                                  To show your own highlights here, you need to update the <code className="text-blue-400">playlistId</code> in the <code className="text-blue-400">App.tsx</code> file. 
                                  Currently showing a default football playlist from your channel.
                                </p>
                              </div>
                            )}
                            {tvChannel.type === 'social' && (
                              <SocialFeed 
                                user={profile} 
                                isLoggedIn={isLoggedIn}
                                onOpenLogin={() => setIsLoginModalOpen(true)}
                              />
                            )}
                          </div>
                        </div>
                      ) : (
                        <iframe
                          className="w-full h-full"
                          src={`https://www.youtube.com/embed/videoseries?list=${tvChannel.playlistId}&autoplay=1&mute=1&rel=0`}
                          allowFullScreen
                          title="LTB Sports TV Highlights"
                        ></iframe>
                      )}
                      {tvChannel.type === 'youtube' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                          <a 
                            href={tvChannel.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="pointer-events-auto bg-red-600 text-white px-6 py-3 rounded-2xl font-black text-sm tracking-widest shadow-2xl flex items-center gap-2 hover:bg-red-700 transition-all active:scale-95"
                          >
                            <Youtube size={20} /> WATCH ON YOUTUBE
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="absolute top-6 left-6 pointer-events-none">
                      <div className="bg-red-600 text-white px-4 py-1.5 rounded-xl font-black text-xs tracking-widest shadow-xl flex items-center gap-2">
                        <Tv size={14} /> LTB TV: {tvChannel.name.toUpperCase()}
                      </div>
                    </div>
                    <div className="absolute bottom-6 right-6 flex items-center gap-2">
                       <div className="bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-white/10">
                         1080p 60fps
                       </div>
                    </div>
                  </div>
                  <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6 p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20">
                        <Tv size={32} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-black text-2xl italic uppercase tracking-tighter leading-none">LTB Sports Network</h3>
                        <p className="text-slate-500 text-sm font-medium mt-1">Broadcasting the beautiful game to the world.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <button
                        onClick={() => handleLtbChannelClick("https://www.youtube.com/@LTBLIVESPORTSTV")}
                        className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-2xl font-bold transition-all active:scale-95 text-center"
                      >
                        Visit Channel
                      </button>
                      <button
                        onClick={() => handleLtbChannelClick("https://www.youtube.com/@LTBLIVESPORTSTV")}
                        className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 px-10 py-4 rounded-2xl font-black text-lg tracking-tight transition-all shadow-xl hover:shadow-red-600/30 text-center active:scale-95 text-white"
                      >
                        🔴 SUBSCRIBE
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 space-y-6">
                    <h3 className="text-xl font-black italic uppercase tracking-tight">Channel Switcher</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {channels.map((ch, i) => (
                        <div key={i} className="group/item relative">
                          <button 
                            onClick={() => setTvChannel(ch)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${tvChannel.name === ch.name ? 'bg-red-600/10 border-red-500/30' : 'bg-slate-950 border-slate-800/50 hover:border-slate-700'}`}
                          >
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <span className={`block text-sm font-black uppercase tracking-tight ${tvChannel.name === ch.name ? 'text-red-500' : 'text-white'}`}>{ch.name}</span>
                                {ch.featured && (
                                  <span className="bg-red-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest text-white">Featured</span>
                                )}
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{ch.desc}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {tvChannel.name === ch.name && <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]"></div>}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLtbChannelClick(ch.url);
                                }}
                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                                title="Open External Link"
                              >
                                <ExternalLink size={14} />
                              </button>
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 space-y-6">
                    <h3 className="text-xl font-black italic uppercase tracking-tight">Live Chat</h3>
                    <div className="bg-slate-950 rounded-2xl border border-slate-800/50 h-64 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                      {chatMessages.map((chat, i) => (
                        <div key={i} className="flex gap-2 text-xs">
                          <span className={`font-black ${chat.color}`}>{chat.user}:</span>
                          <span className="text-slate-400">{chat.msg}</span>
                        </div>
                      ))}
                    </div>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={currentChatMessage}
                        onChange={(e) => setCurrentChatMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Say something..." 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-red-500 transition-all text-white"
                      />
                      <button 
                        onClick={handleSendMessage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-600 p-1.5 rounded-lg text-white hover:bg-red-700 transition-colors"
                      >
                        <Play size={14} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 lg:sticky lg:top-24 h-fit">
                <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-6 space-y-6">
                  <h3 className="text-lg font-black italic uppercase tracking-tight flex items-center gap-2">
                    <Clock size={20} className="text-blue-500" /> TV Schedule
                  </h3>
                  <div className="space-y-4">
                    {(channels.find(c => c.name === tvChannel.name)?.schedule || []).map((item, i) => (
                      <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${item.status === 'Live' ? 'bg-red-600/10 border-red-500/30' : 'bg-slate-950 border-slate-800/50'}`}>
                        <span className="text-xs font-black text-slate-500">{item.time}</span>
                        <div className="flex-1">
                          <h4 className="text-xs font-black uppercase tracking-tight">{item.title}</h4>
                          <span className={`text-[8px] font-bold uppercase tracking-widest ${item.status === 'Live' ? 'text-red-500' : 'text-slate-600'}`}>{item.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 space-y-6">
                   <h3 className="text-xl font-black italic uppercase tracking-tight">Quick Stats</h3>
                   <div className="space-y-4">
                     {[
                       { label: 'Active Viewers', value: '12,402', icon: <User size={16} /> },
                       { label: 'Likes', value: '45.2K', icon: <Trophy size={16} /> },
                       { label: 'Subscribers', value: '1.2M', icon: <Youtube size={16} /> },
                     ].map((stat, i) => (
                       <div key={i} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800/50">
                         <div className="flex items-center gap-2 text-slate-500">
                           {stat.icon}
                           <span className="text-[10px] font-bold uppercase tracking-widest">{stat.label}</span>
                         </div>
                         <span className="text-sm font-black">{stat.value}</span>
                       </div>
                     ))}
                   </div>
                </div>

                <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-[2.5rem] p-8 text-white space-y-4 shadow-xl shadow-red-600/20">
                  <Trophy size={40} className="text-white/50" />
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-tight">Join the LTB VIP Club</h3>
                  <p className="text-white/80 text-sm font-medium">Get exclusive access to premium betting tips and live match streams.</p>
                  <button className="w-full bg-white text-red-600 py-4 rounded-2xl font-black text-lg tracking-tight hover:bg-slate-100 transition-all active:scale-95">
                    UPGRADE NOW
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* Floating TV Button for Mobile */}
        {currentSection !== 'tv' && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentSection('tv')}
            className="md:hidden fixed bottom-24 right-6 z-40 bg-red-600 text-white p-4 rounded-full shadow-2xl shadow-red-600/40 flex items-center justify-center border-2 border-white/20"
          >
            <div className="relative">
              <Tv size={24} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full"></span>
            </div>
          </motion.button>
        )}

        {/* Stream Modal */}
        <AnimatePresence>
          {selectedStream && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-5xl aspect-video bg-black rounded-[3rem] overflow-hidden shadow-2xl border border-slate-800 relative"
              >
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1&rel=0`}
                  allowFullScreen
                  title="Live Match Stream"
                ></iframe>
                <div className="absolute top-6 left-6 bg-red-600 text-white px-4 py-1.5 rounded-xl font-black text-xs tracking-widest shadow-xl flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  LIVE: {selectedStream.title.toUpperCase()}
                </div>
                <button 
                  onClick={() => setSelectedStream(null)}
                  className="absolute top-6 right-6 p-3 bg-black/50 hover:bg-black/80 text-white rounded-2xl backdrop-blur-md transition-all"
                >
                  <X size={24} />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ad Modal */}
        <AdModal 
          isOpen={isAdModalOpen}
          hasWatchedAd={hasWatchedAd}
          onClose={() => {
            setIsAdModalOpen(false);
            setPendingStream(null);
            setPendingHighlightsMatch(null);
            setPendingUrl(null);
            setPendingHighlight(null);
          }}
          onContinue={() => {
            const adLinks = [
              "https://omg10.com/4/10780308",
              "https://omg10.com/4/10780450", // Strong link
              "https://omg10.com/4/10780448"  // Pleasant link
            ];
            const myAdLink = adLinks[Math.floor(Math.random() * adLinks.length)];
            
            if (!hasWatchedAd) {
              // 1. First time: Open the advertisement in a new tab
              window.open(myAdLink, "_blank");
              setHasWatchedAd(true);
            } else {
              // 2. Second time: Handle the requested content (the "real" destination)
              if (pendingUrl) {
                // Open the real destination in another new tab
                window.open(pendingUrl, "_blank");
                setPendingUrl(null);
              } else if (pendingStream) {
                setSelectedStream(pendingStream);
                setPendingStream(null);
              } else if (pendingHighlightsMatch) {
                executeHighlights(pendingHighlightsMatch);
                setPendingHighlightsMatch(null);
              } else if (pendingHighlight) {
                setActiveHighlight(pendingHighlight);
                setPendingHighlight(null);
              }
              // Optional: reset hasWatchedAd if you want them to see another ad later?
              // The user said "if the leave the tab come back to click ltb again take the user to the you-tube channel."
              // This implies they only need to watch one ad per session or per "cycle".
              // Let's reset it so the NEXT click requires another ad? 
              // Or keep it true? Usually users prefer it to stay true for a while.
              // But if I reset it, they have to watch an ad for every 2nd click.
              // Let's keep it true for now.
            }
            
            setIsAdModalOpen(false);
          }}
        />

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 px-6 py-3 z-50 flex items-center justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
          <button
            onClick={() => setCurrentSection('live')}
            className={`flex flex-col items-center gap-1 transition-all ${currentSection === 'live' ? 'text-red-500' : 'text-slate-500'}`}
          >
            <Trophy size={20} className={currentSection === 'live' ? 'scale-110' : ''} />
            <span className="text-[10px] font-black uppercase tracking-widest">Live</span>
          </button>
          <button
            onClick={() => setCurrentSection('streams')}
            className={`flex flex-col items-center gap-1 transition-all ${currentSection === 'streams' ? 'text-red-500' : 'text-slate-500'}`}
          >
            <Play size={20} className={currentSection === 'streams' ? 'scale-110' : ''} />
            <span className="text-[10px] font-black uppercase tracking-widest">Streams</span>
          </button>
          <button
            onClick={() => setCurrentSection('highlights')}
            className={`flex flex-col items-center gap-1 transition-all ${currentSection === 'highlights' ? 'text-red-500' : 'text-slate-500'}`}
          >
            <Play size={20} className={currentSection === 'highlights' ? 'scale-110' : ''} />
            <span className="text-[10px] font-black uppercase tracking-widest">Highlights</span>
          </button>
          <button
            onClick={() => setCurrentSection('tv')}
            className={`flex flex-col items-center gap-1 transition-all ${currentSection === 'tv' ? 'text-red-500' : 'text-slate-500'}`}
          >
            <Tv size={20} className={currentSection === 'tv' ? 'scale-110' : ''} />
            <span className="text-[10px] font-black uppercase tracking-widest">LTB TV</span>
          </button>
          <button
            onClick={() => handleLtbChannelClick("https://www.youtube.com/@LTBDailyTips")}
            className="flex flex-col items-center gap-1 text-slate-500 hover:text-red-500 transition-colors"
          >
            <Youtube size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Tips</span>
          </button>
          <button
            onClick={() => {
              if (matches.length > 0) {
                setSelectedMatchForPrediction(matches[0]);
                setIsPredictionOpen(true);
              }
            }}
            className="flex flex-col items-center gap-1 text-slate-500"
          >
            <Trophy size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Predict</span>
          </button>
        </nav>

        <SupportCard />
      </main>

      <Footer onLtbChannelClick={handleLtbChannelClick} />
      
      <AnimatePresence>
        {isWelcomeOpen && (
          <WelcomeModal isOpen={isWelcomeOpen} onClose={handleCloseWelcome} />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />

      {isProfileOpen && (
          <ProfileModal
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            profile={profile}
            onUpdateProfile={setProfile}
            notifications={notificationSettings}
            onUpdateNotifications={setNotificationSettings}
            onLogout={handleLogout}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNotificationsOpen && (
          <NotificationCenter
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            notifications={notifications}
            onClear={() => setNotifications([])}
            onMarkRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPredictionOpen && (
          <PredictionModal
            isOpen={isPredictionOpen}
            onClose={() => setIsPredictionOpen(false)}
            match={selectedMatchForPrediction}
            onPredict={submitPrediction}
          />
        )}
      </AnimatePresence>

      {/* Audio for Goal Alerts */}
      <audio id="goalSound" src="https://gfxsounds.com/wp-content/uploads/2021/03/Stadium-crowd-cheering-on-goal.mp3" preload="auto"></audio>
    </div>
  );
};

export default App;
