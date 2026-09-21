import { and, asc, eq, ilike } from 'drizzle-orm'

import { db } from './_lib/db'
import { ingredients, userPantry } from './_lib/schema'
import { errorResponse, handleOptions, jsonResponse } from './_lib/response'
import { pantryCreateSchema, pantryUpdateSchema } from './_lib/validators'
import { getRequestUser } from './_lib/user'

export default async function pantry(request: Request) {
  if (request.method === 'OPTIONS') return handleOptions()

  try {
    const user = await getRequestUser(request)

    if (request.method === 'GET') {
      const url = new URL(request.url)
      const search = url.searchParams.get('search')?.trim()
      const pantryItems = await db
        .select({
          id: userPantry.id,
          ingredientId: ingredients.id,
          name: ingredients.name,
          category: ingredients.category,
          quantity: userPantry.quantity,
          unit: userPantry.unit,
          updatedAt: userPantry.updatedAt,
        })
        .from(userPantry)
        .innerJoin(ingredients, eq(userPantry.ingredientId, ingredients.id))
        .where(and(eq(userPantry.userId, user.id), search ? ilike(ingredients.name, `%${search}%`) : undefined))
        .orderBy(asc(ingredients.category), asc(ingredients.name))

      const suggestions = search
        ? await db
            .select({ id: ingredients.id, name: ingredients.name, category: ingredients.category, defaultUnit: ingredients.defaultUnit })
            .from(ingredients)
            .where(ilike(ingredients.name, `%${search}%`))
            .orderBy(asc(ingredients.name))
            .limit(10)
        : []

      return jsonResponse({ pantry: pantryItems, suggestions })
    }

    if (request.method === 'POST') {
      const input = pantryCreateSchema.parse(await request.json())
      const ingredient = input.ingredientId
        ? await db.query.ingredients.findFirst({ where: eq(ingredients.id, input.ingredientId) })
        : await db.query.ingredients.findFirst({ where: eq(ingredients.name, input.name!) })

      if (!ingredient) return errorResponse('Ingredient not found', 404)

      const [item] = await db
        .insert(userPantry)
        .values({ userId: user.id, ingredientId: ingredient.id, quantity: String(input.quantity), unit: input.unit })
        .onConflictDoUpdate({
          target: [userPantry.userId, userPantry.ingredientId],
          set: { quantity: String(input.quantity), unit: input.unit, updatedAt: new Date() },
        })
        .returning()
      return jsonResponse(item, 201)
    }

    if (request.method === 'PUT') {
      const input = pantryUpdateSchema.parse(await request.json())
      const [item] = await db
        .update(userPantry)
        .set({ quantity: String(input.quantity), unit: input.unit, updatedAt: new Date() })
        .where(and(eq(userPantry.id, input.id), eq(userPantry.userId, user.id)))
        .returning()
      return item ? jsonResponse(item) : errorResponse('Pantry item not found', 404)
    }

    if (request.method === 'DELETE') {
      const id = new URL(request.url).searchParams.get('id')
      if (!id) return errorResponse('id query parameter is required', 400)
      const [item] = await db
        .delete(userPantry)
        .where(and(eq(userPantry.id, id), eq(userPantry.userId, user.id)))
        .returning({ id: userPantry.id })
      return item ? jsonResponse({ deleted: true, id: item.id }) : errorResponse('Pantry item not found', 404)
    }

    return errorResponse('Method not allowed', 405)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') return errorResponse('Invalid request', 400, error)
    console.error('Pantry request failed', error)
    return errorResponse('Unable to process pantry request')
  }
}