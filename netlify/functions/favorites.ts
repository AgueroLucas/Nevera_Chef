import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from './_lib/db'
import { errorResponse, handleOptions, jsonResponse } from './_lib/response'
import { favorites, recipes } from './_lib/schema'
import { getRequestUser } from './_lib/user'

const favoriteSchema = z.object({ recipeId: z.string().uuid() })

export default async function favoritesHandler(request: Request) {
  if (request.method === 'OPTIONS') return handleOptions()
  try {
    const user = await getRequestUser(request)
    if (request.method === 'GET') {
      const list = await db.select({ id: favorites.id, recipeId: recipes.id, title: recipes.title, imageUrl: recipes.imageUrl, readyInMinutes: recipes.readyInMinutes, createdAt: favorites.createdAt }).from(favorites).innerJoin(recipes, eq(favorites.recipeId, recipes.id)).where(eq(favorites.userId, user.id)).orderBy(desc(favorites.createdAt))
      return jsonResponse({ favorites: list })
    }
    if (request.method === 'POST') {
      const input = favoriteSchema.parse(await request.json())
      const [favorite] = await db.insert(favorites).values({ userId: user.id, recipeId: input.recipeId }).onConflictDoNothing().returning()
      return jsonResponse(favorite ?? { alreadySaved: true }, 201)
    }
    if (request.method === 'DELETE') {
      const recipeId = z.string().uuid().parse(new URL(request.url).searchParams.get('recipeId'))
      await db.delete(favorites).where(and(eq(favorites.userId, user.id), eq(favorites.recipeId, recipeId)))
      return jsonResponse({ deleted: true })
    }
    return errorResponse('Method not allowed', 405)
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse('Invalid favorite request', 400)
    console.error('Favorites request failed', error)
    return errorResponse('Unable to process favorites')
  }
}