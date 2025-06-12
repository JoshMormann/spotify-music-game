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
    return response.json();
  }

  // Placeholder: Fetch user's recently played tracks
  async getRecentlyPlayed(limit = 50) {
    // TODO: Implement API call
    // Endpoint: GET /me/player/recently-played
    return [];
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
