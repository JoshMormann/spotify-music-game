// src/services/spotify/SpotifyService.js
// Service for interacting with the Spotify Web API

import { makeCacheKey, getCache, setCache } from '../../utils/cache';
import { normalizeTrack, normalizeAlbum } from '../../utils/spotifyNormalize';

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
    if (!expiresIn || !tokenTimestamp) {
      console.debug('[SpotifyService] Token expiry check: missing expiresIn or tokenTimestamp', { expiresIn, tokenTimestamp });
      return true;
    }
    const now = Date.now();
    const expiryTime = parseInt(tokenTimestamp, 10) + parseInt(expiresIn, 10) * 1000;
    const expired = now > expiryTime;
    console.debug('[SpotifyService] Token expiry check:', { now, tokenTimestamp, expiresIn, expiryTime, expired });
    return expired;
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

    console.debug('[SpotifyService] Refreshing token with params:', { clientId, redirectUri, refreshToken });

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      console.error('[SpotifyService] Failed to refresh token', response.status, await response.text());
      throw new Error('Failed to refresh token');
    }
    const data = await response.json();
    localStorage.setItem('spotify_access_token', data.access_token);
    localStorage.setItem('spotify_token_expires_in', data.expires_in);
    localStorage.setItem('spotify_token_timestamp', Date.now().toString());
    console.debug('[SpotifyService] Token refreshed:', {
      access_token: data.access_token,
      expires_in: data.expires_in,
      timestamp: Date.now(),
      refresh_token: data.refresh_token || refreshToken,
    });
    return data.access_token;
  }

  // Get a valid access token, refreshing if needed
  static async getValidAccessToken(redirectUri) {
    if (this.isTokenExpired()) {
      console.debug('[SpotifyService] Access token expired, refreshing...');
      return await this.refreshToken(redirectUri);
    }
    const token = localStorage.getItem('spotify_access_token');
    console.debug('[SpotifyService] Using valid access token:', token);
    return token;
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

  // Fetch user's recently played tracks with normalization
  async getRecentlyPlayed(limit = 50, redirectUri) {
    const endpoint = '/me/player/recently-played';
    const params = { limit };
    const cacheKey = makeCacheKey(endpoint, params);
    const cached = getCache(cacheKey);
    if (cached) return cached;
    const headers = await SpotifyService.getAuthHeader(redirectUri);
    try {
      const response = await SpotifyService.fetchWithRetry(
        `${this.baseUrl}${endpoint}?limit=${limit}`,
        { headers }
      );
      if (!response.ok) {
        throw new Error(handleApiError(response));
      }
      const data = await response.json();
      // Normalize tracks
      const normalized = {
        ...data,
        items: (data.items || []).map(item => ({ ...item, track: normalizeTrack(item.track) })),
      };
      setCache(cacheKey, normalized, 60); // Cache for 60 seconds
      return normalized;
    } catch (error) {
      throw new Error(handleApiError(error.response, error));
    }
  }

  // Fetch album details by ID with normalization
  async getAlbum(albumId, redirectUri) {
    const endpoint = `/albums/${albumId}`;
    const cacheKey = makeCacheKey(endpoint);
    const cached = getCache(cacheKey);
    if (cached) return cached;
    const headers = await SpotifyService.getAuthHeader(redirectUri);
    try {
      const response = await SpotifyService.fetchWithRetry(
        `${this.baseUrl}${endpoint}`,
        { headers }
      );
      if (!response.ok) {
        throw new Error(handleApiError(response));
      }
      const data = await response.json();
      const normalized = normalizeAlbum(data);
      setCache(cacheKey, normalized, 3600); // Cache for 1 hour
      return normalized;
    } catch (error) {
      throw new Error(handleApiError(error.response, error));
    }
  }

  // Fetch track details by ID with normalization
  async getTrack(trackId, redirectUri) {
    const endpoint = `/tracks/${trackId}`;
    const cacheKey = makeCacheKey(endpoint);
    const cached = getCache(cacheKey);
    if (cached) return cached;
    const headers = await SpotifyService.getAuthHeader(redirectUri);
    try {
      const response = await SpotifyService.fetchWithRetry(
        `${this.baseUrl}${endpoint}`,
        { headers }
      );
      if (!response.ok) {
        throw new Error(handleApiError(response));
      }
      const data = await response.json();
      const normalized = normalizeTrack(data);
      setCache(cacheKey, normalized, 3600); // Cache for 1 hour
      return normalized;
    } catch (error) {
      throw new Error(handleApiError(error.response, error));
    }
  }

  // Fetch the current user's Spotify profile
  async getMe(redirectUri) {
    const endpoint = '/me';
    const headers = await SpotifyService.getAuthHeader(redirectUri);
    try {
      const response = await SpotifyService.fetchWithRetry(
        `${this.baseUrl}${endpoint}`,
        { headers }
      );
      if (!response.ok) {
        throw new Error(handleApiError(response));
      }
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(handleApiError(error.response, error));
    }
  }

  // Add more methods as needed
}

export default SpotifyService;
