// Simple in-memory rate limiter — resets on server restart (sufficient for MVP)
// For production scale, replace with Redis-backed solution.

const store = new Map<string, number[]>()

/**
 * Returns true if the request is allowed, false if rate limit exceeded.
 * @param key      Unique identifier (e.g. user ID or IP)
 * @param limit    Max requests allowed within the window
 * @param windowMs Time window in milliseconds (default: 1 hour)
 */
export function rateLimit(key: string, limit = 20, windowMs = 60 * 60 * 1000): boolean {
  const now = Date.now()
  const timestamps = (store.get(key) ?? []).filter(t => now - t < windowMs)
  if (timestamps.length >= limit) return false
  timestamps.push(now)
  store.set(key, timestamps)
  return true
}
