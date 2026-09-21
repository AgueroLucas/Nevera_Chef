const spoonacularBaseUrl = 'https://api.spoonacular.com'

export class SpoonacularError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
  }
}

export async function spoonacularRequest<T>(path: string, options: RequestInit = {}) {
  const apiKey = process.env.SPOONACULAR_API_KEY
  if (!apiKey) throw new SpoonacularError(500, 'SPOONACULAR_API_KEY is not configured')

  const separator = path.includes('?') ? '&' : '?'
  const response = await fetch(`${spoonacularBaseUrl}${path}${separator}apiKey=${encodeURIComponent(apiKey)}`, options)
  if (!response.ok) {
    if (response.status === 402) throw new SpoonacularError(402, 'Spoonacular quota exceeded')
    throw new SpoonacularError(response.status, `Spoonacular request failed with ${response.status}`)
  }
  return response.json() as Promise<T>
}