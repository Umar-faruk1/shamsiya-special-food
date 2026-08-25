'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Edit3, FileText, Filter, ImagePlus, MoreHorizontal, Plus, Search, ShoppingBag, Star, X, Zap } from 'lucide-react'
import ShamsiyaDashboard from './shamsiya-dashboard'
import { getCategories } from '@/lib/services/categories'
import { createMenuItem, getMenuItems, updateMenuItem, type MenuItem } from '@/lib/services/menuItems'
import { uploadFoodImage } from '@/lib/services/storage'


type Category = { id: string; name: string; is_active: boolean }
type Food = MenuItem & { categories?: { id: string; name: string } | null }
type FoodFormValues = { name: string; category_id: string; description: string; price: string; ingredients: string; preparation_time: string; calories: string; image_url: string; available: boolean; featured: boolean }

const emptyForm: FoodFormValues = { name: '', category_id: '', description: '', price: '', ingredients: '', preparation_time: '15', calories: '', image_url: '', available: true, featured: false }

function FoodForm({ food, categories, onClose, onSaved }: { food?: Food; categories: Category[]; onClose: () => void; onSaved: () => void }) {
  const [values, setValues] = useState<FoodFormValues>(food ? { name: food.name, category_id: food.category_id, description: food.description ?? '', price: String(food.price), ingredients: food.ingredients?.join(', ') ?? '', preparation_time: String(food.preparation_time ?? 15), calories: food.calories == null ? '' : String(food.calories), image_url: food.image_url ?? '', available: food.available, featured: food.featured } : emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState(food?.image_url ?? '')
  const set = <K extends keyof FoodFormValues>(key: K, value: FoodFormValues[K]) => setValues(current => ({ ...current, [key]: value }))

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB.')
      return
    }
    setError('')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function save() {
  if (!values.name.trim() || !values.category_id || !values.price) {
    return
  }

  setSaving(true)
  setError('')

  try {
    const ingredientsValue = values.ingredients.split(',').map(ingredient => ingredient.trim()).filter(Boolean)

    const imageUrl = imageFile ? await uploadFoodImage(imageFile) : values.image_url.trim() || null
    const payload = {
      name: values.name.trim(),
      category_id: values.category_id,
      description: values.description.trim(),
      price: Number(values.price),
      ingredients: ingredientsValue,
      preparation_time: Number(values.preparation_time) || 15,
      calories: values.calories
        ? Number(values.calories)
        : null,
      image_url: imageUrl,
      available: values.available,
      featured: values.featured,
    }

    if (food) {
      await updateMenuItem(food.id, payload)
    } else {
      await createMenuItem(payload)
    }

    onSaved()
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : 'Unable to save food.'
    )
  } finally {
    setSaving(false)
  }
}
  return <div className="modal-layer" role="presentation" onClick={onClose}><div className="food-form-modal" role="dialog" aria-modal="true" aria-labelledby="food-form-title" onClick={event => event.stopPropagation()}><div className="drawer-heading"><div><span className="eyebrow">Food catalogue</span><h2 id="food-form-title">{food ? 'Edit food' : 'Add new food'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close form"><X /></button></div><div className="food-form-grid"><div><label className="field-label">Food name<input className="food-input" value={values.name} onChange={event => set('name', event.target.value)} placeholder="e.g. Mandi Chicken" /></label><label className="field-label">Category<select className="food-input" value={values.category_id} onChange={event => set('category_id', event.target.value)}><option value="">Select a category</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><div className="two-fields"><label className="field-label">Price<input className="food-input" type="number" min="0" step="0.01" value={values.price} onChange={event => set('price', event.target.value)} placeholder="0.00" /></label><label className="field-label">Prep time<input className="food-input" type="number" min="1" value={values.preparation_time} onChange={event => set('preparation_time', event.target.value)} /></label></div><label className="field-label">Description<textarea className="food-input" rows={4} value={values.description} onChange={event => set('description', event.target.value)} placeholder="Describe the dish..." /></label></div><div><div className="field-label"><span>Food image</span><label className="image-upload-area" htmlFor="food-image">{imagePreview ? <img src={imagePreview} alt="Food preview" className="food-image-preview" /> : <div className="image-upload-placeholder"><ImagePlus /><strong>Upload food image</strong><span>PNG, JPG or WEBP · Maximum 5MB</span></div>}<input id="food-image" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} hidden /></label>{imagePreview && <button type="button" className="secondary-button" onClick={() => { setImageFile(null); setImagePreview(''); set('image_url', '') }}>Change image</button>}</div><label className="field-label">Ingredients<textarea className="food-input" rows={3} value={values.ingredients} onChange={event => set('ingredients', event.target.value)} placeholder="Rice, chicken, spices..." /></label><label className="toggle-list"><span><strong>Available for ordering</strong><small>Customers can order this food</small></span><input type="checkbox" checked={values.available} onChange={event => set('available', event.target.checked)} /></label><label className="toggle-list"><span><strong>Featured item</strong><small>Show in featured collections</small></span><input type="checkbox" checked={values.featured} onChange={event => set('featured', event.target.checked)} /></label></div></div>{error && <p className="login-message" role="alert">{error}</p>}<div className="food-form-footer"><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={saving || !values.name.trim() || !values.category_id || !values.price} onClick={() => void save()}>{food ? <Check /> : <Plus />}{saving ? 'Saving...' : food ? 'Save changes' : 'Add food'}</button></div></div></div>
}

export function FoodsContent() {
  const [foods, setFoods] = useState<Food[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All categories')
  const [availability, setAvailability] = useState('All availability')
  const [selected, setSelected] = useState<Food | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [foodData, categoryData] = await Promise.all([getMenuItems(), getCategories()])
      setFoods((foodData as Food[]) ?? [])
      setCategories((categoryData as Category[]).filter(item => item.is_active) ?? [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load foods.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const filtered = useMemo(() => foods.filter(food => (category === 'All categories' || food.categories?.name === category) && (availability === 'All availability' || (availability === 'Available' ? food.available : !food.available)) && `${food.name} ${food.description ?? ''}`.toLowerCase().includes(query.toLowerCase())), [foods, query, category, availability])
  const closeForm = () => { setFormOpen(false); setSelected(null) }
  const averageRating = foods.length ? foods.reduce((sum, food) => sum + (food.rating ?? 0), 0) / foods.length : 0

  return <main className="main-content foods-main"><div className="page-heading overview-heading"><div><div className="eyebrow"><span className="live-dot" /> Live menu data</div><h1>Foods</h1><p>Manage your menu, pricing, availability, and featured items.</p></div><div className="heading-actions"><button className="primary-button" onClick={() => { setSelected(null); setFormOpen(true) }}><Plus /> Add food</button></div></div>{error && <div className="login-message" role="alert">{error}</div>}<section className="stats-grid food-stats"><article className="stat-card"><div className="stat-head"><span>Total foods</span><div className="stat-icon"><MoreHorizontal /></div></div><div className="stat-value">{foods.length}</div><div className="stat-foot"><span>Live</span><span>menu items</span></div></article><article className="stat-card"><div className="stat-head"><span>Available</span><div className="stat-icon"><Check /></div></div><div className="stat-value">{foods.filter(food => food.available).length}</div><div className="stat-foot"><span>Live</span><span>for ordering</span></div></article><article className="stat-card"><div className="stat-head"><span>Featured</span><div className="stat-icon"><Zap /></div></div><div className="stat-value">{foods.filter(food => food.featured).length}</div><div className="stat-foot"><span>Live</span><span>featured items</span></div></article><article className="stat-card"><div className="stat-head"><span>Avg. rating</span><div className="stat-icon"><Star /></div></div><div className="stat-value">{averageRating ? averageRating.toFixed(1) : '—'}</div><div className="stat-foot"><span>Live</span><span>customer rating</span></div></article></section><section className="panel foods-table-panel"><div className="foods-toolbar"><div className="foods-search"><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search foods..." aria-label="Search foods" /></div><div className="foods-filters"><select value={category} onChange={event => setCategory(event.target.value)} aria-label="Filter by category"><option>All categories</option>{categories.map(item => <option key={item.id}>{item.name}</option>)}</select><select value={availability} onChange={event => setAvailability(event.target.value)} aria-label="Filter by availability"><option>All availability</option><option>Available</option><option>Unavailable</option></select><button className="secondary-button filter-button"><Filter /> Filters</button></div></div>{loading ? <div className="auth-checking"><p>Loading foods...</p></div> : <div className="foods-table-wrap"><table><thead><tr><th>Food</th><th>Category</th><th>Price</th><th>Rating</th><th>Status</th><th></th></tr></thead><tbody>{filtered.map(food => <tr key={food.id}><td><div className="food-table-name">{food.image_url ? <img src={food.image_url} alt="" /> : <div className="food-thumb"><ShoppingBag /></div>}<div><button className="food-name-link" onClick={() => { setSelected(food); setFormOpen(true) }}>{food.name}</button><small>{food.featured ? 'Featured' : 'Menu item'}</small></div></div></td><td><span className="category-chip">{food.categories?.name ?? 'Uncategorized'}</span></td><td><strong>GH₵{food.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></td><td><span className="food-rating"><Star /> {food.rating?.toFixed(1) ?? '—'}</span></td><td><span className={`status-badge ${food.available ? 'status-success' : 'status-pending'}`}><span />{food.available ? 'Available' : 'Unavailable'}</span></td><td><button className="icon-button" aria-label={`Edit ${food.name}`} onClick={() => { setSelected(food); setFormOpen(true) }}><Edit3 /></button></td></tr>)}</tbody></table>{!filtered.length && <div className="empty-orders"><Search /><strong>No foods found</strong><span>{query ? 'Try changing your search.' : 'Add your first menu item.'}</span></div>}</div>}</section>{formOpen && <FoodForm food={selected ?? undefined} categories={categories} onClose={closeForm} onSaved={() => { closeForm(); void load() }} />}</main>
}

export default function ShamsiyaFoods() { return <ShamsiyaDashboard><FoodsContent /></ShamsiyaDashboard> }
