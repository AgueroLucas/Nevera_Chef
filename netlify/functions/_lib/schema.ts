import { relations } from 'drizzle-orm'
import {
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  index,
} from 'drizzle-orm/pg-core'

export const ingredientCategoryEnum = pgEnum('ingredient_category', [
  'vegetable',
  'protein',
  'dairy',
  'grain',
  'fruit',
  'spice',
  'other',
])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const ingredients = pgTable('ingredients', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  category: ingredientCategoryEnum('category').notNull().default('other'),
  defaultUnit: text('default_unit').notNull().default('unidad'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const userPantry = pgTable(
  'user_pantry',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ingredientId: uuid('ingredient_id')
      .notNull()
      .references(() => ingredients.id, { onDelete: 'cascade' }),
    quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull().default('1'),
    unit: text('unit').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique('user_pantry_user_ingredient_unique').on(table.userId, table.ingredientId)],
)

export const recipes = pgTable('recipes', {
  id: uuid('id').defaultRandom().primaryKey(),
  spoonacularId: integer('spoonacular_id').notNull().unique(),
  title: text('title').notNull(),
  imageUrl: text('image_url'),
  readyInMinutes: integer('ready_in_minutes'),
  servings: integer('servings'),
  instructions: jsonb('instructions'),
  sourceUrl: text('source_url'),
  diets: text('diets').array().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const recipeIngredients = pgTable(
  'recipe_ingredients',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    ingredientId: uuid('ingredient_id').references(() => ingredients.id, { onDelete: 'set null' }),
    amount: numeric('amount', { precision: 10, scale: 2 }),
    unit: text('unit'),
    originalText: text('original_text').notNull(),
  },
  (table) => [index('recipe_ingredients_recipe_id_idx').on(table.recipeId)],
)

export const favorites = pgTable(
  'favorites',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique('favorites_user_recipe_unique').on(table.userId, table.recipeId)],
)

export const searchHistory = pgTable('search_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  ingredientsUsed: jsonb('ingredients_used').notNull(),
  resultsCount: integer('results_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const usersRelations = relations(users, ({ many }) => ({
  pantryItems: many(userPantry),
  favorites: many(favorites),
  searchHistory: many(searchHistory),
}))

export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  pantryItems: many(userPantry),
  recipeIngredients: many(recipeIngredients),
}))

export const userPantryRelations = relations(userPantry, ({ one }) => ({
  user: one(users, { fields: [userPantry.userId], references: [users.id] }),
  ingredient: one(ingredients, { fields: [userPantry.ingredientId], references: [ingredients.id] }),
}))

export const recipesRelations = relations(recipes, ({ many }) => ({
  ingredients: many(recipeIngredients),
  favorites: many(favorites),
}))

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, { fields: [recipeIngredients.recipeId], references: [recipes.id] }),
  ingredient: one(ingredients, {
    fields: [recipeIngredients.ingredientId],
    references: [ingredients.id],
  }),
}))

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  recipe: one(recipes, { fields: [favorites.recipeId], references: [recipes.id] }),
}))

export const searchHistoryRelations = relations(searchHistory, ({ one }) => ({
  user: one(users, { fields: [searchHistory.userId], references: [users.id] }),
}))