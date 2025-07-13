/**
 * Parse a JWT token and return the payload.
 * This does NOT verify the signature — it's only for reading token contents.
 */
export function parseJwt(token) {
  try {
    const base64Payload = token.split('.')[1];
    const decoded = atob(base64Payload);
    return JSON.parse(decoded);
  } catch (err) {
    console.error("Failed to parse JWT:", err);
    return null;
  }
}

/**
 * Returns the expiration time (in seconds since epoch) of the JWT.
 */
export function getTokenExpiration(token) {
  const payload = parseJwt(token);
  return payload?.exp || null;
}

/**
 * Checks if the token has expired.
 */
export function isTokenExpired(token) {
  const exp = getTokenExpiration(token);
  if (!exp) return true;

  const now = Math.floor(Date.now() / 1000); // current time in seconds
  return now >= exp;
}

/**
 * Returns time in seconds until token expires.
 */
export function getTimeUntilExpiration(token) {
  const exp = getTokenExpiration(token);
  if (!exp) return 0;

  const now = Math.floor(Date.now() / 1000);
  return exp - now;
}
