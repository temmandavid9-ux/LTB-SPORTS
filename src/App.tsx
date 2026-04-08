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
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, signOut, getRedirectResult } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getLiveMatches, getStandings, getRecentMatches, getScoreBatHighlights, getScoutEvents, getLiveMatchesRapid, getSeasonStatistics, getApiStatus } from './services/api';

import { Match, Standing, UserProfile, NotificationSettings, AppNotification, Poll, VoiceNote, ScoreBatHighlight, Highlight } from './types';
import { Search, Trophy, Tv, Play, User, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const App: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isApiSuspended, setIsApiSuspended] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isPredictionOpen, setIsPredictionOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
  const [selectedMatchForPrediction, setSelectedMatchForPrediction] = useState<Match | null>(null);

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

  useEffect(() => {
    getRedirectResult(auth).catch(err => {
      console.error("Redirect Login Error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        addNotification('Auth Error', `This domain (${globalThis.location.hostname}) is not authorized for Firebase Authentication.`, 'system');
      }
    });
  }, [addNotification]);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [pendingMatchStream, setPendingMatchStream] = useState<Match | null>(null);
  const [activeMatchStreamId, setActiveMatchStreamId] = useState<number | null>(null);
  const [pendingHighlightsMatch, setPendingHighlightsMatch] = useState<Match | null>(null);
  const [pendingHighlight, setPendingHighlight] = useState<any | null>(null);
  const [pendingScoutMode, setPendingScoutMode] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState<any | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeague, setSelectedLeague] = useState(39);
  const [liveFilter, setLiveFilter] = useState<'all' | 'live' | 'finished'>('all');
  const [matchLeagueFilter, setMatchLeagueFilter] = useState<string>('All');
  const [liveOnlyFilter, setLiveOnlyFilter] = useState(false);
  const [currentSection, setCurrentSection] = useState<'highlights' | 'community' | 'ltb-tv' | 'live-scores'>('highlights');
  const [isTheaterMode, setIsTheaterMode] = useState(false);
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
  const refreshCountRef = React.useRef(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const prevMatchesRef = React.useRef<Match[]>([]);
  const [selectedMatchForDetails, setSelectedMatchForDetails] = useState<Match | null>(null);
  const [commentaryEvents, setCommentaryEvents] = useState<any[]>([]);
  const channels = [
    { 
      name: 'LTB SPORTS Official', 
      desc: 'Main Highlights & Tips', 
      playlistId: 'PL6537rKUWXWcr-0aG-H-CjIiaItbe7nlu', 
      url: 'https://www.youtube.com/@LTBLIVESPORTSTV/playlists', 
      featured: true,
      type: 'youtube',
      schedule: [
        { time: '14:00', title: 'Live: Match Preview', status: 'Live' },
        { time: '16:00', title: 'LTB SPORTS Highlights', status: 'Upcoming' },
        { time: '18:30', title: 'Top 10 Goals', status: 'Upcoming' },
        { time: '20:00', title: 'Fan Q&A', status: 'Upcoming' },
      ]
    },
    { 
      name: 'LTB SPORTS Replays', 
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
      name: 'LTB SPORTS Strategy', 
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
  const [profile, setProfile] = useState<UserProfile>({
    username: 'GuestFan',
    bio: 'Football is life! ⚽',
    profilePic: '',
    favoriteTeam: 'None',
    points: 1250,
    level: 5
  });

  // Firebase Auth Listener
  useEffect(() => {
    console.log("Setting up auth listener...");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user ? `User ${user.uid}` : "No user");
      if (user) {
        setIsLoggedIn(true);
        // Fetch profile from Firestore
        try {
          const docSnap = await getDoc(doc(db, 'users', user.uid));
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // Create default profile if missing
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
            setProfile(newProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          if (error instanceof Error && !error.message.includes('{')) {
            handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          }
        }
      } else {
        setIsLoggedIn(false);
        setProfile({
          username: 'GuestFan',
          bio: 'Football is life! ⚽',
          profilePic: '',
          favoriteTeam: 'None',
          points: 1250,
          level: 5
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Save profile to Firestore when it changes (if logged in)
  useEffect(() => {
    if (isLoggedIn && auth.currentUser) {
      setDoc(doc(db, 'users', auth.currentUser.uid), profile, { merge: true })
        .catch(err => {
          console.error("Error syncing profile:", err);
          handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser?.uid}`);
        });
    }
  }, [profile, isLoggedIn]);

  const handleLogin = (userProfile: any) => {
    setProfile(userProfile);
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      setProfile({
        username: 'GuestFan',
        bio: 'Football is life! ⚽',
        profilePic: '',
        favoriteTeam: 'None',
        points: 1250,
        level: 5
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
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
          const found = matchHighlights(highlights, match);
          
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
    setHasWatchedAd(false);
    setIsAdModalOpen(true);
  };

  const handleWatchStream = (match: Match) => {
    setPendingMatchStream(match);
    setHasWatchedAd(false);
    setIsAdModalOpen(true);
  };

  const matchHighlights = (highlights: ScoreBatHighlight[], match: Match) => {
    const home = match.home_team.name.toLowerCase();
    const away = match.away_team.name.toLowerCase();
    
    // Helper to get common name parts (e.g., "Man City" -> ["man", "city"])
    const getParts = (name: string) => name.toLowerCase().split(/\s+/).filter(p => p.length > 2);
    const homeParts = getParts(home);
    const awayParts = getParts(away);

    return highlights.find(h => {
      const title = h.title.toLowerCase();
      
      // 1. Try exact match for both teams
      if (title.includes(home) && title.includes(away)) return true;
      
      // 2. Try matching significant parts of both team names
      const homeMatch = homeParts.some(p => title.includes(p)) || title.includes(home.substring(0, 5));
      const awayMatch = awayParts.some(p => title.includes(p)) || title.includes(away.substring(0, 5));
      
      return homeMatch && awayMatch;
    });
  };

  const executeHighlights = async (match: Match) => {
    // Try to find highlights
    const highlights = await getScoreBatHighlights();
    
    const found = matchHighlights(highlights, match);

    if (found) {
      const video = found.videos[0];
      const embedUrl = video?.embed.match(/src=['"]([^'"]+)['"]/)?.[1];

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

  // Monitor API Status
  useEffect(() => {
    const interval = setInterval(() => {
      const suspended = getApiStatus();
      if (suspended !== isApiSuspended) {
        setIsApiSuspended(suspended);
        if (suspended) {
          addNotification(
            'API Limit Reached',
            'We are currently using backup data because the live API limit was reached. Live updates may be slower.',
            'news'
          );
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isApiSuspended, addNotification]);

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
      const shouldFetchStandings = refreshCountRef.current % standingsRefreshRate === 0 || isManual || lastFetchedLeague.current !== selectedLeague;
      
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
      refreshCountRef.current += 1;
      
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
  }, [selectedLeague, addNotification, isScoutMode, playGoalSound]);

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
    setHasWatchedAd(false);
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

      <div className="sticky top-0 z-[60]">
        {isApiSuspended && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 py-2 px-4 flex items-center justify-center gap-2 text-amber-500 text-[10px] font-black uppercase tracking-widest">
            <AlertCircle size={12} />
            API Limit Reached - Using Backup Data
          </div>
        )}
        <NewsTicker matches={matches.filter(m => m.status.type === 'inprogress')} isGoalFlash={isGoalFlash} />
        <Header
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
          toggleScoutMode={() => {
            if (!isScoutMode && !hasWatchedAd) {
              setPendingScoutMode(true);
              setHasWatchedAd(false);
              setIsAdModalOpen(true);
            } else {
              setIsScoutMode(!isScoutMode);
            }
          }}
          isGoalFlash={isGoalFlash}
          lastUpdated={lastUpdated}
        />
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {currentSection === 'community' ? (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="text-center py-20 bg-slate-900 rounded-[3rem] border border-slate-800">
               <h3 className="text-2xl font-black italic uppercase tracking-tight text-white mb-2">Community Section</h3>
               <p className="text-slate-500 font-medium">Coming Soon - Connect with other fans!</p>
             </div>
          </section>
        ) : currentSection === 'ltb-tv' ? (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-red-600 rounded-full"></div>
              <h2 className="text-3xl font-black tracking-tight uppercase italic">LTB Live TV</h2>
            </div>
            <div className="bg-slate-900 rounded-[3rem] border border-slate-800 p-8 shadow-2xl overflow-hidden relative">
              <div className="aspect-video bg-black rounded-2xl overflow-hidden relative group">
                <iframe 
                  src={`https://www.youtube.com/embed/videoseries?list=${tvChannel.playlistId}`}
                  className="w-full h-full"
                  allowFullScreen
                  title="LTB TV"
                ></iframe>
              </div>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {channels.map((channel, i) => (
                  <button
                    key={i}
                    onClick={() => setTvChannel(channel)}
                    className={`p-4 rounded-2xl border transition-all text-left space-y-2 ${
                      tvChannel.name === channel.name 
                        ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/20' 
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <h4 className="font-black uppercase tracking-tight text-sm">{channel.name}</h4>
                    <p className="text-[10px] font-medium opacity-80">{channel.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : currentSection === 'live-scores' ? (
          <section className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-red-600 rounded-full"></div>
                <h2 className="text-3xl font-black tracking-tight uppercase italic">Live Scores & Standings</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    placeholder="Search teams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-red-500 transition-all w-full md:w-64"
                  />
                </div>
                <select
                  value={selectedLeague}
                  onChange={(e) => setSelectedLeague(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded-xl py-2 px-4 text-sm focus:outline-none focus:border-red-500 transition-all"
                >
                  {leagues.map(league => (
                    <option key={league.id} value={league.id}>{league.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black italic uppercase tracking-tight">Today's Matches</h3>
                  <button 
                    onClick={() => setLiveOnlyFilter(!liveOnlyFilter)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                      liveOnlyFilter 
                        ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/20' 
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {liveOnlyFilter ? 'Showing Live Only' : 'Show Live Only'}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  {filteredMatches.length > 0 ? (
                    filteredMatches.map(match => (
                      <MatchCard 
                        key={match.id} 
                        match={match}
                        onPredict={handlePredict}
                        onWatchHighlights={handleWatchHighlights}
                        onWatchStream={handleWatchStream}
                        onLtbChannelClick={handleLtbChannelClick}
                        isPending={pendingHighlights.some(m => m.id === match.id)}
                        isScoutMode={isScoutMode}
                        favoriteTeam={profile.favoriteTeam}
                      />
                    ))
                  ) : (
                    <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-12 text-center space-y-4">
                      <div className="w-16 h-16 bg-slate-800 rounded-full mx-auto flex items-center justify-center text-slate-600">
                        <Search size={32} />
                      </div>
                      <h4 className="text-xl font-black italic uppercase tracking-tight">No Matches Found</h4>
                      <p className="text-slate-500 text-sm font-medium">Try adjusting your filters or search query.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-8">
                <StandingsTable 
                  standings={standings} 
                  leagueName={leagues.find(l => l.id === selectedLeague)?.name || 'League'} 
                  isRefreshing={isRefreshing}
                  favoriteTeam={profile.favoriteTeam}
                />
                
                <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 space-y-6">
                  <h3 className="text-xl font-black italic uppercase tracking-tight">League Insights</h3>
                  {seasonStats ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase">Avg Goals/Match</span>
                        <span className="text-lg font-black text-white">{seasonStats.avgGoals}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase">Home Win %</span>
                        <span className="text-lg font-black text-white">{seasonStats.homeWinPct}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase">Clean Sheets</span>
                        <span className="text-lg font-black text-white">{seasonStats.cleanSheets}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs italic">Loading league statistics...</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <HighlightsSection 
            isTheaterMode={isTheaterMode}
            setIsTheaterMode={setIsTheaterMode}
            pendingHighlights={pendingHighlights}
            setPendingHighlights={setPendingHighlights}
            pollerStatus={pollerStatus}
            onSectionChange={setCurrentSection as any}
            onWatchHighlight={(h) => {
              setPendingHighlight(h);
              setIsAdModalOpen(true);
            }}
            onLtbChannelClick={handleLtbChannelClick}
            activeHighlight={activeHighlight}
            setActiveHighlight={setActiveHighlight}
          />
        )}

        {/* Ad Modal */}
        <AdModal 
          isOpen={isAdModalOpen}
          hasWatchedAd={hasWatchedAd}
          onClose={() => {
            setIsAdModalOpen(false);
            setPendingMatchStream(null);
            setPendingHighlightsMatch(null);
            setPendingUrl(null);
            setPendingHighlight(null);
            setPendingScoutMode(false);
          }}
          onContinue={() => {
            // Updated LTB redirect link
            const adLinks = [
              "https://temmandavid9-ux.github.io/ltb-online-free-shopping/"
            ];
            const myAdLink = adLinks[Math.floor(Math.random() * adLinks.length)];

            if (!hasWatchedAd) {
              // 1. First time: Open ad link
              globalThis.open(myAdLink, "_blank");
              setHasWatchedAd(true);
            } else {
              // 2. Second time: Handle the requested content and close modal
              if (pendingScoutMode) {
                setIsScoutMode(!isScoutMode);
                setPendingScoutMode(false);
              } else if (pendingMatchStream) {
                setActiveMatchStreamId(pendingMatchStream.id);
                setPendingMatchStream(null);
              } else if (pendingHighlightsMatch) {
                executeHighlights(pendingHighlightsMatch);
                setPendingHighlightsMatch(null);
              } else if (pendingHighlight) {
                setActiveHighlight(pendingHighlight);
                setPendingHighlight(null);
              } else if (pendingUrl) {
                const win = globalThis.open(pendingUrl, "_blank");
                if (!win) globalThis.location.href = pendingUrl;
                setPendingUrl(null);
              }
              
              setIsAdModalOpen(false);
            }
          }}
        />

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 px-6 py-3 z-50 flex items-center justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
          <button
            onClick={() => setCurrentSection('live-scores')}
            className={`flex flex-col items-center gap-1 transition-all ${currentSection === 'live-scores' ? 'text-red-500' : 'text-slate-500'}`}
          >
            <Trophy size={20} className={currentSection === 'live-scores' ? 'scale-110' : ''} />
            <span className="text-[10px] font-black uppercase tracking-widest">Scores</span>
          </button>
          <button
            onClick={() => setCurrentSection('highlights')}
            className={`flex flex-col items-center gap-1 transition-all ${currentSection === 'highlights' ? 'text-red-500' : 'text-slate-500'}`}
          >
            <Play size={20} className={currentSection === 'highlights' ? 'scale-110' : ''} />
            <span className="text-[10px] font-black uppercase tracking-widest">Highlights</span>
          </button>
          <button
            onClick={() => setCurrentSection('ltb-tv')}
            className={`flex flex-col items-center gap-1 transition-all ${currentSection === 'ltb-tv' ? 'text-red-500' : 'text-slate-500'}`}
          >
            <Tv size={20} className={currentSection === 'ltb-tv' ? 'scale-110' : ''} />
            <span className="text-[10px] font-black uppercase tracking-widest">TV</span>
          </button>
          <button
            onClick={() => setCurrentSection('community')}
            className={`flex flex-col items-center gap-1 transition-all ${currentSection === 'community' ? 'text-red-500' : 'text-slate-500'}`}
          >
            <User size={20} className={currentSection === 'community' ? 'scale-110' : ''} />
            <span className="text-[10px] font-black uppercase tracking-widest">Community</span>
          </button>
        </nav>

        {/* AD SPACE */}
        <div id="adContainer" className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl text-center space-y-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-600 border border-slate-800 px-3 py-1 rounded-full inline-flex items-center gap-2">
            <span className="w-1 h-1 bg-red-600 rounded-full"></span>
            Advertisement
          </div>
          <h3 className="text-xl font-black italic uppercase tracking-tight">LTB Online Free Shopping</h3>
          <p className="text-slate-500 text-sm font-medium">Shop like a billionaire with LTB program and earn $100 daily!</p>
          
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 min-h-[100px] flex flex-col items-center justify-center space-y-4">
             <div className="w-full max-w-2xl aspect-video rounded-xl overflow-hidden shadow-lg border border-slate-800 bg-white flex items-center justify-center p-4">
               <img 
                 src="https://temmandavid9-ux.github.io/ltb-online-free-shopping/logo.png" 
                 alt="Less Talk Business" 
                 className="max-w-full max-h-full object-contain"
                 referrerPolicy="no-referrer"
               />
             </div>
             <p className="text-slate-400 text-sm italic">Ad Space - Official LTB Program</p>
             <a 
               href="https://temmandavid9-ux.github.io/ltb-online-free-shopping/"
               target="_blank"
               rel="noopener noreferrer"
               className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl shadow-red-600/20 active:scale-95"
             >
               Visit LTB Program
               <ExternalLink size={16} />
             </a>
          </div>
        </div>

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
      
      <PwaInstallBanner />
    </div>
  );
};

export default App;
