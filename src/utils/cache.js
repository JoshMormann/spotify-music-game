/**
 * Generate a cache key based on endpoint and params
 */
export function makeCacheKey(endpoint, params = {}) {
  const paramString = Object.keys(params)
    .sort()
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');
  return `${endpoint}?${paramString}`;
}

/**
 * Set a value in cache with TTL (in seconds)
 */
export function setCache(key, value, ttlSeconds) {
  const expires = Date.now() + ttlSeconds * 1000;
  const data = { value, expires };
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Get a value from cache, returns null if expired or not found
 */
export function getCache(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (Date.now() > data.expires) {
      localStorage.removeItem(key);
      return null;
    }
    return data.value;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * Invalidate a cache entry
 */
export function invalidateCache(key) {
  localStorage.removeItem(key);
} 