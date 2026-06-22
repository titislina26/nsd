export function errorHandler(err, req, res, next) {
  console.error('Error occurred:', err.message, err.stack)
  
  const status = err.status || 500
  const message = err.message || 'Internal Server Error'
  
  res.status(status).json({
    error: {
      message,
      status
    }
  })
}
