// src/services/spotify/SpotifyService.js
// Service for interacting with the Spotify Web API

class SpotifyService {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseUrl = 'https://api.spotify.com/v1';
  }

  // Set a new access token
  setAccessToken(token) {
    this.accessToken = token;
  }

  // Check if the access token is expired
  static isTokenExpired() {
    const expiresIn = localStorage.getItem('spotify_token_expires_in');
    const tokenTimestamp = localStorage.getItem('spotify_token_timestamp');
    if (!expiresIn || !tokenTimestamp) return true;
    const now = Date.now();
    return now > (parseInt(tokenTimestamp, 10) + parseInt(expiresIn, 10) * 1000);
  }

  // Refresh the access token using the refresh token
  static async refreshToken(redirectUri) {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    if (!refreshToken) throw new Error('No refresh token available');
    const basicAuth = btoa(`${clientId}:${clientSecret}`);
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);
    params.append('redirect_uri', redirectUri);

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
    const data = await response.json();
    localStorage.setItem('spotify_access_token', data.access_token);
    localStorage.setItem('spotify_token_expires_in', data.expires_in);
    localStorage.setItem('spotify_token_timestamp', Date.now().toString());
    return data.access_token;
  }

  // Get a valid access token, refreshing if needed
  static async getValidAccessToken(redirectUri) {
    if (this.isTokenExpired()) {
      return await this.refreshToken(redirectUri);
    }
    return localStorage.getItem('spotify_access_token');
  }

  // Exchange authorization code for tokens
  static async exchangeCodeForToken(code, redirectUri) {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
    const basicAuth = btoa(`${clientId}:${clientSecret}`);
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirectUri);

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }
    const data = await response.json();
    localStorage.setItem('spotify_token_timestamp', Date.now().toString());
    return data;
  }

  // Fetch user's recently played tracks
  async getRecentlyPlayed(limit = 50, redirectUri) {
    const accessToken = await SpotifyService.getValidAccessToken(redirectUri);
    const response = await fetch(`${this.baseUrl}/me/player/recently-played?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch recently played tracks');
    }
    return response.json();
  }

  // Placeholder: Fetch album details by ID
  async getAlbum(albumId) {
    // TODO: Implement API call
    // Endpoint: GET /albums/{id}
    return null;
  }

  // Placeholder: Fetch track details by ID
  async getTrack(trackId) {
    // TODO: Implement API call
    // Endpoint: GET /tracks/{id}
    return null;
  }

  // Add more methods as needed
}

export default SpotifyService;
