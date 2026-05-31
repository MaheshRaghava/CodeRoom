export const errorHandler = (err, req, res, next) => {
  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] ${req.method} ${req.url} — ${status}: ${message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  res.status(status).json({
    error:   message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};