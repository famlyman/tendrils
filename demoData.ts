// app/demoData.ts

export const demoVines = [
  {
    vine_id: "vine-1",
    name: "Pebble Creek Sports Club",
    join_code: "PEBBLE1",
    is_private: false,
    coordinator_id: "Alex Coordinator",
    logo_url: "", // add a local asset or leave blank
    description: "A vibrant club for all levels.",
    location: "Hickory, NC",
  },
];

export const demoProfiles = [
  {
    user_id: "Alex Coordinator",
    name: "Alex Coordinator",
    bio: "Club founder and 4.0 player.",
    phone: "555-1234",
    rating: 4.0,
    profile_picture: "",
    vine_id: "vine-1",
    role: "Coordinator",
    wins: 12,
    losses: 3,
  },
  {
    user_id: "Jamie Player",
    name: "Jamie Player",
    bio: "Love to play weekends!",
    phone: "555-5678",
    rating: 3.2,
    profile_picture: "",
    vine_id: "vine-1",
    role: "Player",
    wins: 10,
    losses: 2,
  },
  {
    user_id: "Morgan Demo",
    name: "Morgan Demo",
    bio: "Beginner, but improving fast.",
    phone: "555-8765",
    rating: 2.8,
    profile_picture: "",
    vine_id: "vine-1",
    role: "Player",
    wins: 8,
    losses: 4,
  },
  {
    user_id: "Taylor Guest",
    name: "Taylor Guest",
    bio: "Just visiting!",
    phone: "555-4321",
    rating: 3.5,
    profile_picture: "",
    vine_id: "vine-1",
    role: "Player",
    wins: 6,
    losses: 4,
  },
  {
    user_id: "Riley Power",
    name: "Riley Power",
    bio: "Third-place finisher in state championships.",
    phone: "555-9876",
    rating: 4.5,
    profile_picture: "",
    vine_id: "vine-1",
    role: "Player",
    wins: 18,
    losses: 2,
  },
  {
    user_id: "Jordan Smith",
    name: "Jordan Smith",
    bio: "Playing for 5 years, love the competitive atmosphere!",
    phone: "555-2468",
    rating: 3.9,
    profile_picture: "",
    vine_id: "vine-1",
    role: "Player",
    wins: 14,
    losses: 6,
  },
  {
    user_id: "Casey Thompson",
    name: "Casey Thompson",
    bio: "Former tennis player transitioning to pickleball.",
    phone: "555-1357",
    rating: 3.7,
    profile_picture: "",
    vine_id: "vine-1",
    role: "Coordinator",
    wins: 9,
    losses: 7,
  },
  {
    user_id: "Quinn Johnson",
    name: "Quinn Johnson",
    bio: "Looking to improve my dinking game!",
    phone: "555-3690",
    rating: 2.5,
    profile_picture: "",
    vine_id: "vine-1",
    role: "Player",
    wins: 5,
    losses: 9,
  }
];

export const demoTeams = [
  {
    team_id: "team-1",
    vine_id: "vine-1",
    name: "Orlando Smashers",
    members: ["Alex Coordinator", "Jamie Player"],
    wins: 6,
    losses: 2,
  },
  {
    team_id: "team-2",
    vine_id: "vine-1",
    name: "Austin Aces",
    members: ["Morgan Demo", "Taylor Guest"],
    wins: 3,
    losses: 4,
  },
  {
    team_id: "team-3",
    vine_id: "vine-1",
    name: "Miami Volleys",
    members: ["Riley Power", "Jordan Smith"],
    wins: 8,
    losses: 1,
  },
  {
    team_id: "team-4",
    vine_id: "vine-1",
    name: "Denver Dinks",
    members: ["Casey Thompson", "Quinn Johnson"],
    wins: 4,
    losses: 4,
  }
];

export const demoMatches = [
  {
    match_id: "match-1",
    vine_id: "vine-1",
    player_1: "Alex Coordinator",
    player_2: "Jamie Player",
    winner: "Alex Coordinator",
    date: "2025-04-10",
    score: "11-8, 11-9",
    match_type: "singles"
  },
  {
    match_id: "match-2",
    vine_id: "vine-1",
    player_1: "Riley Power",
    player_2: "Jordan Smith",
    winner: "Riley Power",
    date: "2025-04-12",
    score: "11-7, 11-6",
    match_type: "singles"
  },
  {
    match_id: "match-3",
    vine_id: "vine-1",
    player_1: "Alex Coordinator",
    player_2: "Riley Power",
    winner: "Riley Power",
    date: "2025-04-14",
    score: "9-11, 11-9, 11-8",
    match_type: "singles"
  },
  {
    match_id: "match-4",
    vine_id: "vine-1",
    player_1: "Morgan Demo",
    player_2: "Taylor Guest",
    winner: "Taylor Guest",
    date: "2025-04-11",
    score: "11-5, 11-9",
    match_type: "singles"
  },
  {
    match_id: "match-5",
    vine_id: "vine-1",
    player_1: "Casey Thompson",
    player_2: "Quinn Johnson",
    winner: "Casey Thompson",
    date: "2025-04-13",
    score: "11-6, 11-4",
    match_type: "singles"
  },
  {
    match_id: "match-6",
    vine_id: "vine-1",
    player_1: "Taylor Guest",
    player_2: "Casey Thompson",
    winner: "Casey Thompson",
    date: "2025-04-15",
    score: "11-9, 9-11, 11-7",
    match_type: "singles"
  }
];

// Team matches (doubles)
export const demoTeamMatches = [
  {
    match_id: "team-match-1",
    vine_id: "vine-1",
    team_1: "team-1", // Orlando Smashers
    team_2: "team-2", // Austin Aces
    winner: "team-1",
    date: "2025-04-05",
    score: "11-7, 11-9",
    team_1_players: ["Alex Coordinator", "Jamie Player"],
    team_2_players: ["Morgan Demo", "Taylor Guest"]
  },
  {
    match_id: "team-match-2",
    vine_id: "vine-1",
    team_1: "team-3", // Miami Volleys
    team_2: "team-4", // Denver Dinks
    winner: "team-3",
    date: "2025-04-06",
    score: "11-5, 11-3",
    team_1_players: ["Riley Power", "Jordan Smith"],
    team_2_players: ["Casey Thompson", "Quinn Johnson"]
  },
  {
    match_id: "team-match-3",
    vine_id: "vine-1",
    team_1: "team-1", // Orlando Smashers
    team_2: "team-3", // Miami Volleys
    winner: "team-3",
    date: "2025-04-08",
    score: "9-11, 11-7, 11-8",
    team_1_players: ["Alex Coordinator", "Jamie Player"],
    team_2_players: ["Riley Power", "Jordan Smith"]
  },
  {
    match_id: "team-match-4",
    vine_id: "vine-1",
    team_1: "team-2", // Austin Aces
    team_2: "team-4", // Denver Dinks
    winner: "team-4",
    date: "2025-04-09",
    score: "11-9, 11-8",
    team_1_players: ["Morgan Demo", "Taylor Guest"],
    team_2_players: ["Casey Thompson", "Quinn Johnson"]
  },
  {
    match_id: "team-match-5",
    vine_id: "vine-1",
    team_1: "team-3", // Miami Volleys
    team_2: "team-2", // Austin Aces
    winner: "team-3",
    date: "2025-04-12",
    score: "11-4, 11-6",
    team_1_players: ["Riley Power", "Jordan Smith"],
    team_2_players: ["Morgan Demo", "Taylor Guest"]
  },
  {
    match_id: "team-match-6",
    vine_id: "vine-1",
    team_1: "team-4", // Denver Dinks
    team_2: "team-1", // Orlando Smashers
    winner: "team-1",
    date: "2025-04-13",
    score: "8-11, 11-7, 11-9",
    team_1_players: ["Casey Thompson", "Quinn Johnson"],
    team_2_players: ["Alex Coordinator", "Jamie Player"]
  },
  {
    match_id: "team-match-7",
    vine_id: "vine-1",
    team_1: "team-1", // Orlando Smashers
    team_2: "team-4", // Denver Dinks
    winner: "team-1",
    date: "2025-04-15",
    score: "11-8, 9-11, 11-7",
    team_1_players: ["Alex Coordinator", "Jamie Player"],
    team_2_players: ["Casey Thompson", "Quinn Johnson"]
  },
  {
    match_id: "team-match-8",
    vine_id: "vine-1",
    team_1: "team-2", // Austin Aces
    team_2: "team-3", // Miami Volleys
    winner: "team-3",
    date: "2025-04-16",
    score: "11-6, 11-4",
    team_1_players: ["Morgan Demo", "Taylor Guest"],
    team_2_players: ["Riley Power", "Jordan Smith"]
  }
];

export const demoStandings = [
  {
    vine_id: "vine-1",
    rankings: [
      { user_id: "Riley Power", name: "Riley Power", rating: 4.5 },
      { user_id: "Alex Coordinator", name: "Alex Coordinator", rating: 4.0 },
      { user_id: "Jordan Smith", name: "Jordan Smith", rating: 3.9 },
      { user_id: "Casey Thompson", name: "Casey Thompson", rating: 3.7 },
      { user_id: "Taylor Guest", name: "Taylor Guest", rating: 3.5 },
      { user_id: "Jamie Player", name: "Jamie Player", rating: 3.2 },
      { user_id: "Morgan Demo", name: "Morgan Demo", rating: 2.8 },
      { user_id: "Quinn Johnson", name: "Quinn Johnson", rating: 2.5 },
    ],
  },
];

// Team standings
export const demoTeamStandings = [
  {
    vine_id: "vine-1",
    rankings: [
      { 
        team_id: "team-3", 
        name: "Miami Volleys", 
        members: ["Riley Power", "Jordan Smith"],
        wins: 8,
        losses: 1,
        win_percentage: 0.889
      },
      { 
        team_id: "team-1", 
        name: "Orlando Smashers", 
        members: ["Alex Coordinator", "Jamie Player"],
        wins: 6,
        losses: 2,
        win_percentage: 0.750
      },
      { 
        team_id: "team-4", 
        name: "Denver Dinks", 
        members: ["Casey Thompson", "Quinn Johnson"],
        wins: 4,
        losses: 4,
        win_percentage: 0.500
      },
      { 
        team_id: "team-2", 
        name: "Austin Aces", 
        members: ["Morgan Demo", "Taylor Guest"],
        wins: 3,
        losses: 4,
        win_percentage: 0.429
      }
    ],
  },
];