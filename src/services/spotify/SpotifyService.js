// src/services/spotify/SpotifyService.js
// Service for interacting with the Spotify Web API

const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1000; // 1 second

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function handleApiError(response, error) {
  if (response && response.status === 429) {
    return 'Rate limit exceeded. Retrying...';
  }
  if (response && response.status === 401) {
    return 'Unauthorized. Please log in again.';
  }
  if (response && response.status === 403) {
    return 'Access denied.';
  }
  if (response && response.status === 404) {
    return 'Resource not found.';
  }
  if (error && error.message) {
    return error.message;
  }
  return 'An unknown error occurred.';
}

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

  // Utility: Get Authorization header for API calls
  static async getAuthHeader(redirectUri) {
    const token = await this.getValidAccessToken(redirectUri);
    return { Authorization: `Bearer ${token}` };
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

  // Helper for fetch with retry on 429
  static async fetchWithRetry(url, options, retries = MAX_RETRIES, backoff = INITIAL_BACKOFF) {
    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const response = await fetch(url, options);
      if (response.status === 429) {
        // Rate limited, exponential backoff
        const retryAfter = response.headers.get('Retry-After');
        const wait = retryAfter ? parseInt(retryAfter, 10) * 1000 : backoff * Math.pow(2, attempt);
        await sleep(wait);
        continue;
      }
      if (!response.ok) {
        lastError = response;
        break;
      }
      return response;
    }
    throw lastError || new Error('Failed to fetch after retries');
  }

  // Fetch user's recently played tracks
  async getRecentlyPlayed(limit = 50, redirectUri) {
    const headers = await SpotifyService.getAuthHeader(redirectUri);
    try {
      const response = await SpotifyService.fetchWithRetry(
        `${this.baseUrl}/me/player/recently-played?limit=${limit}`,
        { headers }
      );
      if (!response.ok) {
        throw new Error(handleApiError(response));
      }
      return response.json();
    } catch (error) {
      throw new Error(handleApiError(error.response, error));
    }
  }

  // Fetch album details by ID
  async getAlbum(albumId, redirectUri) {
    const headers = await SpotifyService.getAuthHeader(redirectUri);
    try {
      const response = await SpotifyService.fetchWithRetry(
        `${this.baseUrl}/albums/${albumId}`,
        { headers }
      );
      if (!response.ok) {
        throw new Error(handleApiError(response));
      }
      return response.json();
    } catch (error) {
      throw new Error(handleApiError(error.response, error));
    }
  }

  // Fetch track details by ID
  async getTrack(trackId, redirectUri) {
    const headers = await SpotifyService.getAuthHeader(redirectUri);
    try {
      const response = await SpotifyService.fetchWithRetry(
        `${this.baseUrl}/tracks/${trackId}`,
        { headers }
      );
      if (!response.ok) {
        throw new Error(handleApiError(response));
      }
      return response.json();
    } catch (error) {
      throw new Error(handleApiError(error.response, error));
    }
  }

  // Add more methods as needed
}

export default SpotifyService;
