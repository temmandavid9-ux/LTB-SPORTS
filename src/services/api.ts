import { Match, Standing, MatchStatistics, ScoreBatHighlight } from '../types';

const API_KEY = (import.meta as any).env.VITE_RAPID_API_KEY || "0549520c16msha2b6cad21800869p1164e0jsn6b42d4827889";
const API_HOST = "api-football-v1.p.rapidapi.com";
const ALLSPORTS_API_HOST = "allsportsapi2.p.rapidapi.com";

export const getScoreBatHighlights = async (): Promise<ScoreBatHighlight[]> => {
  try {
    const response = await fetch('https://www.scorebat.com/video-api/v3/');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.response || [];
  } catch (error) {
    console.error("Error fetching ScoreBat highlights:", error);
    return [];
  }
};

const fetchFromAPI = async (endpoint: string) => {
  const url = `https://${API_HOST}/v3/${endpoint}`;
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': API_HOST
    }
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    throw error;
  }
};

export const getLiveMatchesRapid = async (apiKey: string, leagueId: number | null = 39): Promise<Match[]> => {
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
    }
  };

  try {
    const url = leagueId 
      ? `https://api-football-v1.p.rapidapi.com/v3/fixtures?league=${leagueId}&live=all`
      : `https://api-football-v1.p.rapidapi.com/v3/fixtures?live=all`;
      
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    
    const matches = (data.response || []).map((m: any) => ({
      id: m.fixture.id,
      home_team: { id: m.teams.home.id, name: m.teams.home.name, logo: m.teams.home.logo },
      away_team: { id: m.teams.away.id, name: m.teams.away.name, logo: m.teams.away.logo },
      home_score: { current: m.goals.home },
      away_score: { current: m.goals.away },
      status: { description: `${m.fixture.status.elapsed}'`, type: "inprogress" },
      tournament: { name: m.league.name, id: m.league.id },
      venue: m.fixture.venue.name
    }));

    if (matches.length === 0 && leagueId) {
      // If no matches in selected league, try fetching ALL live matches as fallback
      return getLiveMatchesRapid(apiKey, null);
    }

    return matches;
  } catch (error) {
    console.error("RapidAPI Live Matches Error:", error);
    return [];
  }
};

export const getScoutEvents = async (apiKey: string, fixtureId: number): Promise<any[]> => {
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
    }
  };

  try {
    const response = await fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures/events?fixture=${fixtureId}`, options);
    const data = await response.json();
    return data.response || [];
  } catch (error) {
    console.error("Scout Data Error:", error);
    return [];
  }
};

export const getMatchStatistics = async (matchId: number): Promise<MatchStatistics> => {
  try {
    const data = await fetchFromAPI(`event/${matchId}/statistics`);
    const stats = data.statistics?.[0]?.groups || [];
    
    // Find relevant stats in the groups
    const findStat = (name: string) => {
      for (const group of stats) {
        const item = group.statisticsItems.find((i: any) => i.name === name);
        if (item) return { home: parseInt(item.home), away: parseInt(item.away) };
      }
      return { home: 0, away: 0 };
    };

    return {
      possession: findStat('Ball possession'),
      shotsOnTarget: findStat('Shots on target'),
      totalShots: findStat('Total shots'),
      corners: findStat('Corner kicks'),
      offsides: findStat('Offsides'),
      fouls: findStat('Fouls'),
      yellowCards: findStat('Yellow cards'),
      redCards: findStat('Red cards')
    };
  } catch (error) {
    // Mock stats fallback
    return {
      possession: { home: 55, away: 45 },
      shotsOnTarget: { home: 6, away: 4 },
      totalShots: { home: 12, away: 9 },
      corners: { home: 5, away: 3 },
      offsides: { home: 2, away: 1 },
      fouls: { home: 10, away: 12 },
      yellowCards: { home: 2, away: 1 },
      redCards: { home: 0, away: 0 }
    };
  }
};

export const getLiveMatches = async (): Promise<Match[]> => {
  const apiKey = (import.meta as any).env.VITE_RAPID_API_KEY || API_KEY;
  
  const fetchSportLive = async (sport: 'football' | 'american-football'): Promise<Match[]> => {
    try {
      const response = await fetch(`https://${ALLSPORTS_API_HOST}/api/${sport}/matches/live`, {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': ALLSPORTS_API_HOST,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) return [];
      
      const data = await response.json();
      const matches = data.data || [];
      
      return matches.map((m: any) => ({
        id: m.id,
        sport,
        home_team: { 
          id: m.homeTeam?.id || 0, 
          name: m.homeTeam?.name || 'Home', 
          logo: m.homeTeam?.logo || '' 
        },
        away_team: { 
          id: m.awayTeam?.id || 0, 
          name: m.awayTeam?.name || 'Away', 
          logo: m.awayTeam?.logo || '' 
        },
        home_score: { current: m.scores?.home || 0 },
        away_score: { current: m.scores?.away || 0 },
        status: { 
          description: m.status?.description || 'Live', 
          type: m.status?.type === 'inprogress' ? 'inprogress' : 'inprogress' 
        },
        tournament: { 
          name: m.tournament?.name || (sport === 'american-football' ? 'NFL/NCAA' : 'Live Match'), 
          id: m.tournament?.id || 0 
        },
        venue: m.venue || ''
      }));
    } catch (e) {
      console.error(`Error fetching ${sport} live matches:`, e);
      return [];
    }
  };

  try {
    const [footballMatches, americanFootballMatches] = await Promise.all([
      fetchSportLive('football'),
      fetchSportLive('american-football')
    ]);
    
    const combined = [...footballMatches, ...americanFootballMatches];
    
    if (combined.length > 0) return combined;

    // Fallback to api-football-v1 if allsportsapi2 fails or returns nothing
    const data = await fetchFromAPI('fixtures?live=all');
    return (data.response || []).map((m: any) => ({
      id: m.fixture.id,
      sport: 'football',
      home_team: { id: m.teams.home.id, name: m.teams.home.name, logo: m.teams.home.logo },
      away_team: { id: m.teams.away.id, name: m.teams.away.name, logo: m.teams.away.logo },
      home_score: { current: m.goals.home },
      away_score: { current: m.goals.away },
      status: { description: `${m.fixture.status.elapsed}'`, type: "inprogress" },
      tournament: { name: m.league.name, id: m.league.id },
      venue: m.fixture.venue.name
    }));
  } catch (error) {
    console.error("Live Matches Error:", error);
    return [
      {
        id: 1,
        sport: 'football',
        home_team: { id: 101, name: "Manchester City" },
        away_team: { id: 102, name: "Arsenal" },
        home_score: { current: 1 },
        away_score: { current: 1 },
        status: { description: "75'", type: "inprogress" },
        tournament: { name: "Premier League", id: 1 },
        events: [
          { id: 'e1', type: 'Goal', time: { elapsed: 24 }, team: { id: 101, name: 'Man City' }, player: { id: 1, name: 'Haaland' }, detail: 'Goal' },
          { id: 'e2', type: 'Card', time: { elapsed: 35 }, team: { id: 102, name: 'Arsenal' }, player: { id: 2, name: 'Rice' }, detail: 'Yellow Card' },
          { id: 'e3', type: 'Goal', time: { elapsed: 58 }, team: { id: 102, name: 'Arsenal' }, player: { id: 3, name: 'Saka' }, detail: 'Penalty' },
          { id: 'e4', type: 'subst', time: { elapsed: 65 }, team: { id: 101, name: 'Man City' }, player: { id: 4, name: 'Foden' }, detail: 'Substitution' },
          { id: 'e5', type: 'Card', time: { elapsed: 72 }, team: { id: 101, name: 'Man City' }, player: { id: 5, name: 'Rodri' }, detail: 'Yellow Card' }
        ]
      },
      {
        id: 2,
        sport: 'football',
        home_team: { id: 103, name: "Real Madrid" },
        away_team: { id: 104, name: "Barcelona" },
        home_score: { current: 2 },
        away_score: { current: 0 },
        status: { description: "42'", type: "inprogress" },
        tournament: { name: "La Liga", id: 251 },
        events: [
          { id: 'e6', type: 'Goal', time: { elapsed: 12 }, team: { id: 103, name: 'Real Madrid' }, player: { id: 6, name: 'Vinícius Jr.' }, detail: 'Goal' },
          { id: 'e7', type: 'Goal', time: { elapsed: 38 }, team: { id: 103, name: 'Real Madrid' }, player: { id: 7, name: 'Rodrygo' }, detail: 'Goal' },
          { id: 'e8', type: 'Card', time: { elapsed: 40 }, team: { id: 104, name: 'Barcelona' }, player: { id: 8, name: 'Gavi' }, detail: 'Yellow Card' }
        ]
      }
    ];
  }
};

export const getRecentMatches = async (): Promise<Match[]> => {
  try {
    const data = await fetchFromAPI('fixtures?last=10');
    return (data.response || []).map((m: any) => ({
      id: m.fixture.id,
      home_team: { id: m.teams.home.id, name: m.teams.home.name, logo: m.teams.home.logo },
      away_team: { id: m.teams.away.id, name: m.teams.away.name, logo: m.teams.away.logo },
      home_score: { current: m.goals.home },
      away_score: { current: m.goals.away },
      status: { description: "FT", type: "finished" },
      tournament: { name: m.league.name, id: m.league.id },
      venue: m.fixture.venue.name
    }));
  } catch (error) {
    return [];
  }
};

export const getSeasonStatistics = async (leagueId: number = 39): Promise<any> => {
  const apiKey = (import.meta as any).env.VITE_RAPID_API_KEY || API_KEY;
  
  // Mapping from api-football-v1 IDs to allsportsapi2 tournament IDs
  const tournamentMapping: Record<number, { tournamentId: number; seasonId: number }> = {
    39: { tournamentId: 17, seasonId: 76986 }, // Premier League 25/26
    140: { tournamentId: 8, seasonId: 77000 }, // La Liga (Example IDs)
    135: { tournamentId: 23, seasonId: 77001 }, // Serie A (Example IDs)
    61: { tournamentId: 34, seasonId: 77002 }, // Ligue 1 (Example IDs)
    2: { tournamentId: 7, seasonId: 77003 }, // Champions League (Example IDs)
  };

  const config = tournamentMapping[leagueId] || tournamentMapping[39];
  
  try {
    const response = await fetch(`https://${ALLSPORTS_API_HOST}/api/tournament/${config.tournamentId}/season/${config.seasonId}/statistics/info`, {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': ALLSPORTS_API_HOST,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error("Season Statistics Error:", error);
    return null;
  }
};

export const getStandings = async (leagueId: number = 39, season?: number): Promise<Standing[]> => {
  const apiKey = (import.meta as any).env.VITE_RAPID_API_KEY || API_KEY;
  
  // Calculate current season (e.g., if March 2026, season is 2025)
  const now = new Date();
  // Season 2025 covers 2025/2026. In March 2026, we are in the 2025 season.
  const currentSeason = season || (now.getMonth() < 6 ? now.getFullYear() - 1 : now.getFullYear());
  
  try {
    const response = await fetch(`https://api-football-v1.p.rapidapi.com/v3/standings?league=${leagueId}&season=${currentSeason}`, {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
      }
    });
    const data = await response.json();
    const standings = data.response?.[0]?.league?.standings?.[0] || [];
    
    if (standings.length === 0) throw new Error("No standings found");

    return standings.map((team: any) => ({
      position: team.rank,
      team: {
        id: team.team.id,
        name: team.team.name,
        logo: team.team.logo
      },
      played: team.all.played,
      won: team.all.win,
      draw: team.all.draw,
      lost: team.all.lose,
      goalsFor: team.all.goals.for,
      goalsAgainst: team.all.goals.against,
      points: team.points,
      goalsDiff: team.goalsDiff,
      form: team.form,
      status: team.status === 'up' ? 'up' : team.status === 'down' ? 'down' : 'same'
    }));
  } catch (error) {
    console.error("RapidAPI Standings Error:", error);
    // League-specific mock data for 2025/2026 Season (March 2026 status)
    const leagueMocks: Record<number, any[]> = {
      39: [ // Premier League 25/26
        { name: "Manchester City", logo: "https://media.api-sports.io/football/teams/50.png", points: 72, played: 29 },
        { name: "Liverpool", logo: "https://media.api-sports.io/football/teams/40.png", points: 70, played: 29 },
        { name: "Arsenal", logo: "https://media.api-sports.io/football/teams/42.png", points: 68, played: 29 },
        { name: "Aston Villa", logo: "https://media.api-sports.io/football/teams/66.png", points: 59, played: 29 }
      ],
      140: [ // La Liga 25/26
        { name: "Real Madrid", logo: "https://media.api-sports.io/football/teams/541.png", points: 75, played: 29 },
        { name: "Barcelona", logo: "https://media.api-sports.io/football/teams/529.png", points: 68, played: 29 },
        { name: "Atletico Madrid", logo: "https://media.api-sports.io/football/teams/530.png", points: 62, played: 29 }
      ],
      135: [ // Serie A 25/26
        { name: "Inter Milan", logo: "https://media.api-sports.io/football/teams/505.png", points: 78, played: 29 },
        { name: "Juventus", logo: "https://media.api-sports.io/football/teams/496.png", points: 65, played: 29 },
        { name: "AC Milan", logo: "https://media.api-sports.io/football/teams/489.png", points: 63, played: 29 }
      ],
      61: [ // Ligue 1 25/26
        { name: "PSG", logo: "https://media.api-sports.io/football/teams/85.png", points: 68, played: 26 },
        { name: "Monaco", logo: "https://media.api-sports.io/football/teams/91.png", points: 52, played: 26 },
        { name: "Lille", logo: "https://media.api-sports.io/football/teams/79.png", points: 50, played: 26 }
      ]
    };

    const mockTeams = leagueMocks[leagueId] || leagueMocks[39];

    return mockTeams.map((t, i) => ({
      position: i + 1,
      team: { id: i + 100, name: t.name, logo: t.logo },
      played: t.played || 29,
      won: Math.floor(t.points / 3),
      draw: t.points % 3,
      lost: (t.played || 29) - Math.floor(t.points / 3) - (t.points % 3),
      goalsFor: 70 - i * 5,
      goalsAgainst: 25 + i * 5,
      points: t.points,
      goalsDiff: 45 - i * 10,
      form: "WWWDW",
      status: 'same'
    }));
  }
};
