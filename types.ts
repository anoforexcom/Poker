
export interface User {
  id: string;
  name: string;
  avatar: string;
  balance: number;
  rank: string;
  tier: string;
}

export interface PokerTable {
  id: string;
  name: string;
  gameType: string;
  stakes: string;
  players: number;
  maxPlayers: number;
  avgPot: number;
  status: 'active' | 'waiting' | 'full';
}

export interface Course {
  id: string;
  title: string;
  module: string;
  progress: number;
  image: string;
}

export interface ForumPost {
  id: string;
  author: string;
  title: string;
  content: string;
  votes: number;
  comments: number;
  tags: string[];
  time: string;
}
