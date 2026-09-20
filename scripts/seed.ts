import 'dotenv/config'

import { db } from '../netlify/functions/_lib/db'
import { ingredients } from '../netlify/functions/_lib/schema'

const seedIngredients = [
  ['tomate', 'vegetable', 'unidad'], ['cebolla', 'vegetable', 'unidad'], ['ajo', 'vegetable', 'diente'],
  ['zanahoria', 'vegetable', 'unidad'], ['patata', 'vegetable', 'unidad'], ['calabacin', 'vegetable', 'unidad'],
  ['pimiento rojo', 'vegetable', 'unidad'], ['pimiento verde', 'vegetable', 'unidad'], ['brocoli', 'vegetable', 'gramos'],
  ['espinaca', 'vegetable', 'gramos'], ['lechuga', 'vegetable', 'unidad'], ['pepino', 'vegetable', 'unidad'],
  ['champiñon', 'vegetable', 'gramos'], ['maiz', 'vegetable', 'gramos'], ['aguacate', 'fruit', 'unidad'],
  ['manzana', 'fruit', 'unidad'], ['platano', 'fruit', 'unidad'], ['limon', 'fruit', 'unidad'],
  ['naranja', 'fruit', 'unidad'], ['fresa', 'fruit', 'gramos'], ['pollo', 'protein', 'gramos'],
  ['carne de ternera', 'protein', 'gramos'], ['carne picada', 'protein', 'gramos'], ['cerdo', 'protein', 'gramos'],
  ['pavo', 'protein', 'gramos'], ['salmon', 'protein', 'gramos'], ['atun', 'protein', 'lata'],
  ['huevo', 'protein', 'unidad'], ['garbanzos', 'protein', 'gramos'], ['lentejas', 'protein', 'gramos'],
  ['leche', 'dairy', 'mililitros'], ['yogur natural', 'dairy', 'unidad'], ['queso', 'dairy', 'gramos'],
  ['mantequilla', 'dairy', 'gramos'], ['nata', 'dairy', 'mililitros'], ['arroz', 'grain', 'gramos'],
  ['pasta', 'grain', 'gramos'], ['pan', 'grain', 'rebanada'], ['harina', 'grain', 'gramos'],
  ['avena', 'grain', 'gramos'], ['quinoa', 'grain', 'gramos'], ['aceite de oliva', 'other', 'mililitros'],
  ['vinagre', 'other', 'mililitros'], ['sal', 'spice', 'gramos'], ['pimienta negra', 'spice', 'gramos'],
  ['pimenton', 'spice', 'gramos'], ['oregano', 'spice', 'gramos'], ['comino', 'spice', 'gramos'],
  ['perejil', 'spice', 'gramos'], ['albahaca', 'spice', 'gramos'], ['salsa de tomate', 'other', 'gramos'],
] as const

await db.insert(ingredients).values(
  seedIngredients.map(([name, category, defaultUnit]) => ({ name, category, defaultUnit })),
).onConflictDoNothing({ target: ingredients.name })

console.log(`Seed completado: ${seedIngredients.length} ingredientes procesados.`)