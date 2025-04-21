// types/db.ts
// Auto-generated from Supabase schema on 2025-04-21
// These interfaces should be kept in sync with your Supabase tables.

export interface Flower {
  flower_id: string;
  vine_id: string;
  challenger_id: string;
  opponent_id: string;
  status: string;
  date: string; // ISO timestamp
  result: any; // JSONB - define a more specific type if possible
  score: string;
  team_1_id: string;
  team_2_id: string;
}

export interface FruitRecord {
  record_id: string;
  vine_id: string;
  user_id: string;
  wins: number;
  losses: number;
  fruit_harvested: number;
  node_id: string;
}

export interface LadderHistory {
  history_id: string;
  node_id: string;
  vine_id: string;
  old_position: number;
  new_position: number;
  change_date: string; // ISO timestamp
  reason: string;
  match_id: string;
}

export interface LadderNode {
  node_id: string;
  vine_id: string;
  position: number;
  profile_id: string;
}

export interface Profile {
  id: string;
  user_id: string;
  vine_id: string;
  phone: string;
  rating: number;
  bio: string;
  profile_picture: string;
  created_at: string;
  name: string;
}

export interface Team {
  team_id: string;
  vine_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  wins: number;
  losses: number;
  total_points: number;
}

export interface TeamMember {
  team_id: string;
  user_id: string;
  joined_at: string;
}

export interface UserLadderNode {
  node_id: string;
  user_id: string;
  vine_id: string; // Note: schema says text, not uuid
  position: number;
  updated_at: string;
  team_id: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  vine_id: string;
  role: number;
}

export interface Vine {
  vine_id: string;
  name: string;
  join_code: string;
  coordinator_id: string;
  description: string;
  is_public: boolean;
  is_private: boolean;
  created_at: string;
  logo_url: string;
  location: string;
  contact_email: string;
  website: string;
}
