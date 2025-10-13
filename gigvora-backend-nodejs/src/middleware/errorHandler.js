export default function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status ?? err.statusCode ?? 500;
  const message = err.message || 'Internal server error';
  const details = err.details ?? null;

  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    message,
    details,
  });
}
