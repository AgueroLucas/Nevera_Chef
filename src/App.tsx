import { useEffect, useState } from 'react'
import { ChefHat, Clock3, Heart, Leaf, LoaderCircle, Plus, Search, ShoppingBasket, Trash2, Utensils } from 'lucide-react'

import { pantryApi, recipesApi, type Favorite, type IngredientSuggestion, type PantryItem, type Recipe } from './lib/api'
import './App.css'

type View = 'pantry' | 'recipes' | 'favorites'

function App() {
  const [view, setView] = useState<View>('pantry')
  const [items, setItems] = useState<PantryItem[]>([])
  const [suggestions, setSuggestions] = useState<IngredientSuggestion[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [search, setSearch] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState('unidad')
  const [selected, setSelected] = useState<IngredientSuggestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { void loadPantry() }, [])

  async function loadPantry(searchTerm = '') {
    try {
      setLoading(true)
      const result = await pantryApi.list(searchTerm)
      setItems(result.pantry)
      setSuggestions(result.suggestions)
      setError('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo cargar la nevera')
    } finally { setLoading(false) }
  }

  async function searchRecipes() {
    if (items.length === 0) { setError('Añade al menos un ingrediente para buscar recetas'); setView('pantry'); return }
    try {
      setWorking(true)
      const result = await recipesApi.search({ ingredients: items.map((item) => item.name), number: 12 })
      setRecipes(result.recipes)
      setView('recipes')
      setError('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron buscar recetas')
    } finally { setWorking(false) }
  }

  async function loadFavorites() {
    try {
      setWorking(true)
      const result = await recipesApi.favorites()
      setFavorites(result.favorites)
      setView('favorites')
      setError('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar favoritos')
    } finally { setWorking(false) }
  }

  function handleSearch(value: string) { setSearch(value); setSelected(null); void loadPantry(value) }
  function selectSuggestion(suggestion: IngredientSuggestion) { setSelected(suggestion); setSearch(suggestion.name); setUnit(suggestion.defaultUnit); setSuggestions([]) }

  async function addIngredient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    try {
      setWorking(true)
      await pantryApi.add({ ingredientId: selected.id, quantity: Number(quantity), unit })
      setSearch(''); setSelected(null); setQuantity('1'); setSuggestions([])
      await loadPantry()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo guardar el ingrediente')
    } finally { setWorking(false) }
  }

  async function removeIngredient(id: string) { await pantryApi.remove(id); setItems((current) => current.filter((item) => item.id !== id)) }
  async function toggleFavorite(recipe: Recipe) {
    const isFavorite = favorites.some((favorite) => favorite.recipeId === recipe.id)
    if (isFavorite) {
      await recipesApi.removeFavorite(recipe.id)
      setFavorites((current) => current.filter((favorite) => favorite.recipeId !== recipe.id))
    } else {
      await recipesApi.saveFavorite(recipe.id)
      setFavorites((current) => [...current, { id: recipe.id, recipeId: recipe.id, title: recipe.title, imageUrl: recipe.imageUrl, readyInMinutes: recipe.readyInMinutes }])
    }
  }

  const groupedItems = items.reduce<Record<string, PantryItem[]>>((groups, item) => {
    groups[item.category] = [...(groups[item.category] ?? []), item]
    return groups
  }, {})

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" type="button" onClick={() => setView('pantry')}><span className="brand-mark"><ChefHat size={20} /></span><span>Nevera Chef</span></button>
      <nav className="main-nav" aria-label="Navegación principal">
        <button className={view === 'pantry' ? 'active' : ''} onClick={() => setView('pantry')}>Mi nevera</button>
        <button className={view === 'recipes' ? 'active' : ''} onClick={() => void searchRecipes()}>Recetas</button>
        <button className={view === 'favorites' ? 'active' : ''} onClick={() => void loadFavorites()}>Favoritos</button>
      </nav>
      <button className="avatar" type="button" aria-label="Perfil">MC</button>
    </header>
    <main>
      {view === 'pantry' && <>
        <section className="welcome-row"><div><p className="eyebrow"><Leaf size={14} /> TU COCINA, MÁS INTELIGENTE</p><h1>¿Qué hay en tu nevera?</h1><p className="intro">Añade tus ingredientes y descubre qué puedes cocinar hoy.</p></div><div className="stat"><strong>{items.length}</strong><span>ingredientes<br />disponibles</span></div></section>
        <section className="workspace" id="nevera">
          <div className="add-panel"><div className="section-heading"><div><span className="number">01</span><h2>Añade ingredientes</h2></div><span className="hint">Empieza escribiendo</span></div><form onSubmit={addIngredient} className="ingredient-form"><label className="search-field"><Search size={18} /><input value={search} onChange={(event) => handleSearch(event.target.value)} placeholder="Busca un ingrediente..." aria-label="Buscar ingrediente" /></label>{suggestions.length > 0 && <div className="suggestions">{suggestions.map((suggestion) => <button type="button" key={suggestion.id} onClick={() => selectSuggestion(suggestion)}><span>{suggestion.name}</span><small>{suggestion.category}</small></button>)}</div>}<div className="form-row"><label>Cantidad<input type="number" min="0.1" step="0.1" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label><select className="unit-select" aria-label="Unidad" value={unit} onChange={(event) => setUnit(event.target.value)}><option>unidad</option><option>gramos</option><option>mililitros</option><option>lata</option><option>rebanada</option></select><button className="add-button" type="submit" disabled={!selected || working}><Plus size={18} />{working ? 'Guardando...' : 'Añadir'}</button></div></form></div>
          <div className="pantry-panel"><div className="section-heading"><div><span className="number">02</span><h2>Tu nevera</h2></div><span className="fresh"><span /> Actualizada ahora</span></div>{loading ? <div className="loading">Cargando ingredientes...</div> : items.length === 0 ? <div className="empty-state"><ShoppingBasket size={32} /><strong>Tu nevera está vacía</strong><span>Añade ingredientes para empezar a cocinar.</span></div> : <div className="ingredient-groups">{Object.entries(groupedItems).map(([category, categoryItems]) => <div className="ingredient-group" key={category}><div className="category-label"><span>{category}</span><b>{categoryItems.length}</b></div>{categoryItems.map((item) => <div className="ingredient-row" key={item.id}><span className="ingredient-icon"><Utensils size={15} /></span><strong>{item.name}</strong><span className="quantity">{item.quantity} {item.unit}</span><button type="button" className="delete-button" onClick={() => void removeIngredient(item.id)} aria-label={`Eliminar ${item.name}`}><Trash2 size={16} /></button></div>)}</div>)}</div>}</div>
        </section>
        <section className="recipe-teaser"><div className="teaser-icon"><Clock3 size={22} /></div><div><p className="eyebrow">LISTO PARA COCINAR</p><h2>Recetas hechas para tu nevera</h2><p>Usa tus ingredientes para encontrar combinaciones deliciosas.</p></div><button type="button" onClick={() => void searchRecipes()} disabled={working}>{working ? 'Buscando...' : 'Explorar recetas'}</button></section>
      </>}
      {view === 'recipes' && <RecipeView recipes={recipes} favorites={favorites} working={working} onSearch={() => void searchRecipes()} onFavorite={(recipe) => void toggleFavorite(recipe)} />}
      {view === 'favorites' && <FavoriteView favorites={favorites} onRemove={async (id) => { await recipesApi.removeFavorite(id); setFavorites((current) => current.filter((favorite) => favorite.recipeId !== id)) }} />}
      {error && <p className="error-message global-error">{error}</p>}
    </main>
  </div>
}

function RecipeView({ recipes, favorites, working, onSearch, onFavorite }: { recipes: Recipe[]; favorites: Favorite[]; working: boolean; onSearch: () => void; onFavorite: (recipe: Recipe) => void }) {
  return <section className="view-section"><div className="view-heading"><div><p className="eyebrow"><Utensils size={14} /> IDEAS PARA HOY</p><h1>Recetas para tu nevera</h1><p className="intro">Ordenadas por cuánto puedes aprovechar de lo que ya tienes.</p></div><button className="add-button" onClick={onSearch} disabled={working}>{working ? <LoaderCircle className="spin" size={17} /> : <Search size={17} />} Buscar de nuevo</button></div>{recipes.length === 0 ? <div className="empty-state large"><ShoppingBasket size={35} /><strong>Aún no hay resultados</strong><span>Vuelve a tu nevera y añade ingredientes.</span></div> : <div className="recipe-grid">{recipes.map((recipe) => <article className="recipe-card" key={recipe.id}>{recipe.imageUrl ? <img src={recipe.imageUrl} alt="" /> : <div className="recipe-image-placeholder"><Utensils /></div>}<div className="recipe-card-body"><div className="recipe-meta"><span>{recipe.matchPercent}% match</span><button type="button" onClick={() => onFavorite(recipe)} aria-label="Guardar favorito"><Heart size={17} fill={favorites.some((favorite) => favorite.recipeId === recipe.id) ? 'currentColor' : 'none'} /></button></div><h2>{recipe.title}</h2><p><Clock3 size={14} /> {recipe.readyInMinutes ?? '?'} min · {recipe.missingIngredients} faltantes</p></div></article>)}</div>}</section>
}

function FavoriteView({ favorites, onRemove }: { favorites: Favorite[]; onRemove: (id: string) => void }) {
  return <section className="view-section"><div className="view-heading"><div><p className="eyebrow"><Heart size={14} /> TU COLECCIÓN</p><h1>Recetas favoritas</h1><p className="intro">Tus ideas guardadas para volver a ellas cuando quieras.</p></div></div>{favorites.length === 0 ? <div className="empty-state large"><Heart size={35} /><strong>Aún no tienes favoritos</strong><span>Guarda una receta desde la pestaña Recetas.</span></div> : <div className="recipe-grid">{favorites.map((recipe) => <article className="recipe-card" key={recipe.id}>{recipe.imageUrl ? <img src={recipe.imageUrl} alt="" /> : <div className="recipe-image-placeholder"><Utensils /></div>}<div className="recipe-card-body"><div className="recipe-meta"><span>Guardada</span><button type="button" onClick={() => onRemove(recipe.recipeId)} aria-label="Eliminar favorito"><Trash2 size={17} /></button></div><h2>{recipe.title}</h2><p><Clock3 size={14} /> {recipe.readyInMinutes ?? '?'} min</p></div></article>)}</div>}</section>
}

export default App
