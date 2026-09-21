import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from './_lib/db'
import { errorResponse, handleOptions, jsonResponse } from './_lib/response'
import { SpoonacularError, spoonacularRequest } from './_lib/spoonacular'
import { getRequestUser } from './_lib/user'
import { ingredients, recipes, userPantry } from './_lib/schema'

export default async function recipesDetail(request: Request) {
  if (request.method === 'OPTIONS') return handleOptions()
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405)
  try {
    const id = z.coerce.number().int().positive().parse(new URL(request.url).searchParams.get('id'))
    const user = await getRequestUser(request)
    const recipe = await db.query.recipes.findFirst({ where: eq(recipes.spoonacularId, id), with: { ingredients: true } })
    if (!recipe) {
      const remote = await spoonacularRequest<{ id: number; title: string; image?: string; readyInMinutes?: number; servings?: number; instructions?: string; sourceUrl?: string; diets?: string[]; extendedIngredients?: Array<{ amount?: number; unit?: string; original?: string }> }>(`/recipes/${id}/information`)
      return jsonResponse({ ...remote, instructions: remote.instructions?.replace(/<[^>]*>/g, '').trim() ?? '', ingredients: remote.extendedIngredients ?? [] })
    }
    const pantry = await db.select({ name: ingredients.name }).from(userPantry).innerJoin(ingredients, eq(userPantry.ingredientId, ingredients.id)).where(eq(userPantry.userId, user.id))
    const pantryNames = new Set(pantry.map((item) => item.name.toLowerCase()))
    return jsonResponse({ id: recipe.spoonacularId, title: recipe.title, imageUrl: recipe.imageUrl, readyInMinutes: recipe.readyInMinutes, servings: recipe.servings, instructions: recipe.instructions, sourceUrl: recipe.sourceUrl, diets: recipe.diets, ingredients: recipe.ingredients.map((item) => ({ originalText: item.originalText, amount: item.amount, unit: item.unit, inPantry: pantryNames.has(item.originalText.toLowerCase()) })) })
  } catch (error) {
    if (error instanceof SpoonacularError) return errorResponse(error.message, error.status === 402 ? 402 : 502)
    if (error instanceof z.ZodError) return errorResponse('A valid recipe id is required', 400)
    console.error('Recipe detail failed', error)
    return errorResponse('Unable to load recipe')
  }
}