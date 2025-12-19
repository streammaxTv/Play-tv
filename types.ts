
export interface XtreamCredentials {
  dns: string;
  username: string;
  password: string;
  proxyUrl?: string;
}

export interface UserInfo {
  username: string;
  status: string;
  exp_date: string;
  is_trial: string;
  active_cons: string;
  max_connections: string;
  created_at: string;
  auth: number;
}

export interface ServerInfo {
  url: string;
  port: string;
  https_port: string;
  server_protocol: string;
  timezone: string;
  timestamp_now: number;
}

export interface AuthResponse {
  user_info: UserInfo;
  server_info: ServerInfo;
}

export interface Category {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface StreamItem {
  num: number;
  name: string;
  stream_type: 'live' | 'movie' | 'series';
  series_id?: number;
  stream_id: number;
  stream_icon: string;
  cover?: string; // Standard for Series posters
  episode_num?: number; // Identification for episodes
  epg_channel_id: string;
  added: string;
  category_id: string;
  rating?: string | number;
  container_extension?: string;
  plot?: string;
}

export interface FavoriteItem {
  id: string | number;
  type: ContentType;
  data: StreamItem;
}

export interface HistoryItem {
  id: string | number;
  type: ContentType;
  data: StreamItem;
  timestamp: number;
}

export type ContentType = 'live' | 'vod' | 'series' | 'favorites' | 'history' | 'search' | 'settings';

export interface AppSettings {
  tvMode: boolean;
  pin: string | null;
  autoUpdate: boolean;
}

export interface EpgProgram {
  id: string;
  start: string;
  end: string;
  title: string;
  description: string;
  start_timestamp?: string;
  stop_timestamp?: string;
}

export interface VodInfoResponse {
  info: {
    name?: string;
    movie_image?: string;
    plot?: string;
    rating?: string | number;
    genre?: string;
    director?: string;
    actors?: string;
    duration?: string;
  };
  movie_data?: StreamItem;
}

export interface Episode {
  id: string;
  episode_num: number;
  title: string;
  container_extension: string;
  info: {
    movie_image?: string;
    plot?: string;
    duration?: string;
    rating?: string | number;
  };
}

export interface Season {
  season_number: number;
  name: string;
  episode_count: number;
}

export interface SeriesDetails {
  seasons: Season[];
  episodes: {
    [key: string]: Episode[];
  };
  info: {
    name: string;
    cover: string;
    movie_image: string;
    plot: string;
    rating: string | number;
    genre: string;
    director: string;
    actors: string;
  };
}
