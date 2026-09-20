const allowedOrigin = process.env.ALLOWED_ORIGIN ?? '*'

export function jsonResponse(data: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': allowedOrigin,
      'access-control-allow-headers': 'content-type, x-user-email',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      ...headers,
    },
  })
}

export function errorResponse(message: string, status = 500, details?: unknown) {
  return jsonResponse({ error: message, ...(details ? { details } : {}) }, status)
}

export function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': allowedOrigin,
      'access-control-allow-headers': 'content-type, x-user-email',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
  })
}