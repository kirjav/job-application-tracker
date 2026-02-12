function handleError(res, err, fallbackMessage = "Internal Server Error") {
  const status = err.statusCode || err.status || 500;

  // Always log the full error server-side for debugging
  console.error(`[${status}] ${fallbackMessage}:`, err);

  // Only expose err.message for client errors (4xx); use fallbackMessage for 5xx
  // to avoid leaking internal details (Prisma, stack traces, etc.)
  const message = status < 500 ? (err.message || fallbackMessage) : fallbackMessage;
  return res.status(status).json({ error: message });
}

module.exports = { handleError };