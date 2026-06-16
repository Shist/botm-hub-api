export interface OsuTokenResponse {
  access_token: string;
  expires_in: number;
}

export interface OsuMatchEvent {
  id: number;
}

export interface OsuMatchUser {
  id: number;
}

export interface OsuMatchData {
  match?: unknown;
  events?: OsuMatchEvent[];
  users?: OsuMatchUser[];
}
