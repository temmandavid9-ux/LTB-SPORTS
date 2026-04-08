export interface MatchStatistics {
  possession: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  totalShots: { home: number; away: number };
  corners: { home: number; away: number };
  offsides: { home: number; away: number };
  fouls: { home: number; away: number };
  yellowCards: { home: number; away: number };
  redCards: { home: number; away: number };
}

export interface MatchEvent {
  id: string;
  type: string;
  time: {
    elapsed: number;
    extra?: number;
  };
  team: {
    id: number;
    name: string;
    logo?: string;
  };
  player: {
    id: number;
    name: string;
  };
  assist?: {
    id: number;
    name: string;
  };
  detail: string;
  comments?: string;
}

export interface Match {
  id: number;
  sport?: 'football' | 'american-football';
  home_team: {
    id: number;
    name: string;
    logo?: string;
  };
  away_team: {
    id: number;
    name: string;
    logo?: string;
  };
  home_score: {
    current: number;
  };
  away_score: {
    current: number;
  };
  status: {
    description: string;
    type: string;
  };
  tournament: {
    name: string;
    id: number;
  };
  venue?: string;
  time?: string;
  statistics?: MatchStatistics;
  events?: MatchEvent[];
}

export interface Standing {
  position: number;
  team: {
    id: number;
    name: string;
    logo?: string;
  };
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  goalsDiff?: number;
  form?: string;
  status?: 'up' | 'down' | 'same';
}

export interface ChatMessage {
  id: string;
  user: string;
  text: string;
  timestamp: number;
}

export interface VoteData {
  home: number;
  draw: number;
  away: number;
}

export interface UserProfile {
  username: string;
  bio: string;
  profilePic: string;
  favoriteTeam: string;
  points: number;
  level: number;
}

export interface NotificationSettings {
  goalAlerts: boolean;
  matchReminders: boolean;
  newsUpdates: boolean;
  pushEnabled: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'goal' | 'news' | 'system';
  timestamp: number;
  read: boolean;
}

export interface SocialReply {
  id: string;
  userId: string;
  username: string;
  userPic: string;
  content: string;
  timestamp: number;
}

export interface SocialPost {
  id: string;
  userId: string;
  username: string;
  userPic: string;
  content: string;
  timestamp: number;
  likes: number;
  likedByMe: boolean;
  replies?: SocialReply[];
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  hasVoted?: boolean;
  votedOptionId?: string;
}

export interface VoiceNote {
  id: string;
  userId: string;
  username: string;
  userPic: string;
  duration: string;
  timestamp: number;
  likes: number;
  isLiked?: boolean;
  audioUrl?: string;
}

export interface ScoreBatHighlight {
  title: string;
  competition: string;
  matchviewUrl: string;
  competitionUrl: string;
  thumbnail: string;
  date: string;
  videos: {
    title: string;
    embed: string;
  }[];
}

export interface Highlight {
  id: string;
  matchName: string;
  date: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
  league: string;
  embed?: string;
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
