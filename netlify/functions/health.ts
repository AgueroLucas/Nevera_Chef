import { sql } from 'drizzle-orm'

import { db } from './_lib/db'
import { errorResponse, handleOptions, jsonResponse } from './_lib/response'

export default async function health(request: Request) {
  if (request.method === 'OPTIONS') return handleOptions()
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    await db.execute(sql`select 1`)
    return jsonResponse({ status: 'ok', database: 'ok', timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('Health check failed', error)
    return errorResponse('Database unavailable', 503)
  }
}