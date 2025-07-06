function handleError(res, err, fallbackMessage = "Internal Server Error") {
  console.error(err);
  const status = err.statusCode || err.status || 500;
  const message = err.message || fallbackMessage;
  return res.status(status).json({ error: message });
}

module.exports = { handleError };