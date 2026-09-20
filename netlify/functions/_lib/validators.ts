import { z } from 'zod'

export const ingredientCategorySchema = z.enum([
  'vegetable',
  'protein',
  'dairy',
  'grain',
  'fruit',
  'spice',
  'other',
])

export const pantryCreateSchema = z.object({
  ingredientId: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(100).optional(),
  quantity: z.coerce.number().positive().max(999999),
  unit: z.string().trim().min(1).max(30),
}).refine((value) => value.ingredientId || value.name, {
  message: 'ingredientId or name is required',
})

export const pantryUpdateSchema = z.object({
  id: z.string().uuid(),
  quantity: z.coerce.number().positive().max(999999),
  unit: z.string().trim().min(1).max(30),
})

export const emailSchema = z.string().email().max(254).default('demo@neverachef.local')