export default function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
    details: err.details || null,
  });
}
