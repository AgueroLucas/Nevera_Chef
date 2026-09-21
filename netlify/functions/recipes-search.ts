import { eq } from 'drizzle-orm'

import { db } from './_lib/db'
import { errorResponse, handleOptions, jsonResponse } from './_lib/response'
import { SpoonacularError, spoonacularRequest } from './_lib/spoonacular'
import { getRequestUser } from './_lib/user'
import { recipeIngredients, recipes, searchHistory } from './_lib/schema'
import { z } from 'zod'

const searchSchema = z.object({
  ingredients: z.array(z.string().trim().min(1).max(100)).min(1).max(20),
  diets: z.array(z.string().trim().min(1)).max(10).optional(),
  maxReadyTime: z.number().int().positive().max(600).optional(),
  number: z.number().int().positive().max(20).default(12),
})

type FindResult = { id: number; title: string; image?: string; usedIngredientCount: number; missedIngredientCount: number }
type RecipeInfo = { id: number; title: string; image?: string; readyInMinutes?: number; servings?: number; instructions?: string; sourceUrl?: string; diets?: string[]; extendedIngredients?: Array<{ amount?: number; unit?: string; original?: string; name?: string }> }

function cleanInstructions(value?: string) {
  return value?.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() ?? ''
}

export default async function recipesSearch(request: Request) {
  if (request.method === 'OPTIONS') return handleOptions()
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    const input = searchSchema.parse(await request.json())
    const user = await getRequestUser(request)
    const params = new URLSearchParams({ ingredients: input.ingredients.join(','), ranking: '2', number: String(input.number), ignorePantry: 'true' })
    const found = await spoonacularRequest<FindResult[]>(`/recipes/findByIngredients?${params}`)
    if (found.length === 0) {
      await db.insert(searchHistory).values({ userId: user.id, ingredientsUsed: input.ingredients, resultsCount: 0 })
      return jsonResponse({ recipes: [] })
    }

    const ids = found.map((recipe) => recipe.id).join(',')
    const info = await spoonacularRequest<RecipeInfo[]>(`/recipes/informationBulk?ids=${ids}&includeNutrition=false`)
    const foundById = new Map(found.map((recipe) => [recipe.id, recipe]))
    const output = []

    for (const recipe of info) {
      if (input.maxReadyTime && recipe.readyInMinutes && recipe.readyInMinutes > input.maxReadyTime) continue
      const match = foundById.get(recipe.id)
      const [saved] = await db.insert(recipes).values({
        spoonacularId: recipe.id,
        title: recipe.title,
        imageUrl: recipe.image,
        readyInMinutes: recipe.readyInMinutes,
        servings: recipe.servings,
        instructions: cleanInstructions(recipe.instructions),
        sourceUrl: recipe.sourceUrl,
        diets: recipe.diets ?? [],
      }).onConflictDoUpdate({ target: recipes.spoonacularId, set: { title: recipe.title, imageUrl: recipe.image, readyInMinutes: recipe.readyInMinutes, servings: recipe.servings, instructions: cleanInstructions(recipe.instructions), sourceUrl: recipe.sourceUrl, diets: recipe.diets ?? [] } }).returning({ id: recipes.id })
      await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, saved.id))
      if (recipe.extendedIngredients?.length) {
        await db.insert(recipeIngredients).values(recipe.extendedIngredients.map((ingredient) => ({ recipeId: saved.id, amount: ingredient.amount?.toString(), unit: ingredient.unit ?? null, originalText: ingredient.original ?? ingredient.name ?? 'Ingrediente' })))
      }
      output.push({ id: saved.id, spoonacularId: recipe.id, title: recipe.title, imageUrl: recipe.image, readyInMinutes: recipe.readyInMinutes, servings: recipe.servings, diets: recipe.diets ?? [], matchPercent: match ? Math.round((match.usedIngredientCount / Math.max(match.usedIngredientCount + match.missedIngredientCount, 1)) * 100) : 0, missingIngredients: match?.missedIngredientCount ?? 0 })
    }
    await db.insert(searchHistory).values({ userId: user.id, ingredientsUsed: input.ingredients, resultsCount: output.length })
    return jsonResponse({ recipes: output })
  } catch (error) {
    if (error instanceof SpoonacularError) return errorResponse(error.message, error.status === 402 ? 402 : 502)
    if (error instanceof z.ZodError) return errorResponse('Invalid search request', 400, error.flatten())
    console.error('Recipe search failed', error)
    return errorResponse('Unable to search recipes')
  }
}