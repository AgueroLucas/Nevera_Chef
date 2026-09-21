export type PantryItem = {
  id: string
  ingredientId: string
  name: string
  category: string
  quantity: string
  unit: string
  updatedAt: string
}

export type IngredientSuggestion = {
  id: string
  name: string
  category: string
  defaultUnit: string
}

export type Recipe = {
  id: string
  spoonacularId: number
  title: string
  imageUrl?: string
  readyInMinutes?: number
  servings?: number
  diets: string[]
  matchPercent: number
  missingIngredients: number
}

export type Favorite = {
  id: string
  recipeId: string
  title: string
  imageUrl?: string
  readyInMinutes?: number
}

type PantryResponse = {
  pantry: PantryItem[]
  suggestions: IngredientSuggestion[]
}

const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options?.headers ?? {}) },
  })
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? 'No se pudo completar la solicitud')
  }
  return response.json() as Promise<T>
}

export const pantryApi = {
  list: (search = '') => request<PantryResponse>(`/pantry${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  add: (input: { ingredientId: string; quantity: number; unit: string }) =>
    request<PantryItem>('/pantry', { method: 'POST', body: JSON.stringify(input) }),
  remove: (id: string) => request<{ deleted: boolean }>(`/pantry?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
}

export const recipesApi = {
  search: (input: { ingredients: string[]; diets?: string[]; maxReadyTime?: number; number?: number }) =>
    request<{ recipes: Recipe[] }>('/recipes-search', { method: 'POST', body: JSON.stringify(input) }),
  favorites: () => request<{ favorites: Favorite[] }>('/favorites'),
  saveFavorite: (recipeId: string) => request('/favorites', { method: 'POST', body: JSON.stringify({ recipeId }) }),
  removeFavorite: (recipeId: string) => request(`/favorites?recipeId=${encodeURIComponent(recipeId)}`, { method: 'DELETE' }),
}