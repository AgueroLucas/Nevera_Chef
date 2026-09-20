import { useEffect, useState } from 'react'
import { ChefHat, ChevronDown, Clock3, Leaf, Plus, Search, ShoppingBasket, Trash2, Utensils } from 'lucide-react'

import { pantryApi, type IngredientSuggestion, type PantryItem } from './lib/api'
import './App.css'

function App() {
  const [items, setItems] = useState<PantryItem[]>([])
  const [suggestions, setSuggestions] = useState<IngredientSuggestion[]>([])
  const [search, setSearch] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState('unidad')
  const [selected, setSelected] = useState<IngredientSuggestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void loadPantry()
  }, [])

  async function loadPantry(searchTerm = '') {
    try {
      setLoading(true)
      const result = await pantryApi.list(searchTerm)
      setItems(result.pantry)
      setSuggestions(result.suggestions)
      setError('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo cargar la nevera')
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(value: string) {
    setSearch(value)
    setSelected(null)
    void loadPantry(value)
  }

  function selectSuggestion(suggestion: IngredientSuggestion) {
    setSelected(suggestion)
    setSearch(suggestion.name)
    setUnit(suggestion.defaultUnit)
    setSuggestions([])
  }

  async function addIngredient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    try {
      setSaving(true)
      await pantryApi.add({ ingredientId: selected.id, quantity: Number(quantity), unit })
      setSearch('')
      setSelected(null)
      setQuantity('1')
      setSuggestions([])
      await loadPantry()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo guardar el ingrediente')
    } finally {
      setSaving(false)
    }
  }

  async function removeIngredient(id: string) {
    await pantryApi.remove(id)
    setItems((current) => current.filter((item) => item.id !== id))
  }

  const groupedItems = items.reduce<Record<string, PantryItem[]>>((groups, item) => {
    groups[item.category] = [...(groups[item.category] ?? []), item]
    return groups
  }, {})

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Nevera Chef inicio"><span className="brand-mark"><ChefHat size={20} /></span><span>Nevera Chef</span></a>
        <nav className="main-nav" aria-label="Navegación principal"><a className="active" href="#nevera">Mi nevera</a><a href="#recetas">Recetas</a><a href="#favoritos">Favoritos</a></nav>
        <button className="avatar" type="button" aria-label="Abrir perfil">MC</button>
      </header>

      <main>
        <section className="welcome-row"><div><p className="eyebrow"><Leaf size={14} /> TU COCINA, MÁS INTELIGENTE</p><h1>¿Qué hay en tu nevera?</h1><p className="intro">Añade tus ingredientes y descubre qué puedes cocinar hoy.</p></div><div className="stat"><strong>{items.length}</strong><span>ingredientes<br />disponibles</span></div></section>

        <section className="workspace" id="nevera">
          <div className="add-panel">
            <div className="section-heading"><div><span className="number">01</span><h2>Añade ingredientes</h2></div><span className="hint">Empieza escribiendo</span></div>
            <form onSubmit={addIngredient} className="ingredient-form">
              <label className="search-field"><Search size={18} /><input value={search} onChange={(event) => handleSearch(event.target.value)} placeholder="Busca un ingrediente..." aria-label="Buscar ingrediente" /><kbd>⌘ K</kbd></label>
              {suggestions.length > 0 && <div className="suggestions">{suggestions.map((suggestion) => <button type="button" key={suggestion.id} onClick={() => selectSuggestion(suggestion)}><span>{suggestion.name}</span><small>{suggestion.category}</small></button>)}</div>}
              <div className="form-row"><label>Cantidad<input type="number" min="0.1" step="0.1" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label><label>Unidad<div className="select-wrap"><select value={unit} onChange={(event) => setUnit(event.target.value)}><option>unidad</option><option>gramos</option><option>mililitros</option><option>lata</option><option>rebanada</option></select><ChevronDown size={15} /></div></label><button className="add-button" type="submit" disabled={!selected || saving}><Plus size={18} />{saving ? 'Guardando...' : 'Añadir'}</button></div>
            </form>
          </div>

          <div className="pantry-panel"><div className="section-heading"><div><span className="number">02</span><h2>Tu nevera</h2></div><span className="fresh"><span /> Actualizada ahora</span></div>{error && <p className="error-message">{error}</p>}{loading ? <div className="loading">Cargando ingredientes...</div> : items.length === 0 ? <div className="empty-state"><ShoppingBasket size={32} /><strong>Tu nevera está vacía</strong><span>Añade ingredientes para empezar a cocinar.</span></div> : <div className="ingredient-groups">{Object.entries(groupedItems).map(([category, categoryItems]) => <div className="ingredient-group" key={category}><div className="category-label"><span>{category}</span><b>{categoryItems.length}</b></div>{categoryItems.map((item) => <div className="ingredient-row" key={item.id}><span className="ingredient-icon"><Utensils size={15} /></span><strong>{item.name}</strong><span className="quantity">{item.quantity} {item.unit}</span><button type="button" className="delete-button" onClick={() => void removeIngredient(item.id)} aria-label={`Eliminar ${item.name}`}><Trash2 size={16} /></button></div>)}</div>)}</div>}</div>
        </section>
        <section className="recipe-teaser" id="recetas"><div className="teaser-icon"><Clock3 size={22} /></div><div><p className="eyebrow">PRÓXIMAMENTE</p><h2>Recetas hechas para tu nevera</h2><p>Cuando tengamos tus ingredientes, encontraremos combinaciones deliciosas para ti.</p></div><button type="button" disabled>Explorar recetas</button></section>
      </main>
    </div>
  )
}

export default App
