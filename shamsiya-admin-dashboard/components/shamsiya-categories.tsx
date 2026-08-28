"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Edit3,
  FolderPlus,
  MoreHorizontal,
  Plus,
  Search,
  ShoppingBag,
  Star,
  X,
} from "lucide-react";
import { Sidebar, Topbar } from "./shamsiya-dashboard";
import {
  createCategory,
  getCategories,
  updateCategory,
} from "@/lib/services/categories";

type Category = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order?: number | null;
};

const tones = ["orange", "sand", "brown", "yellow", "green", "rose"];
const emojis = ["🍛", "🍚", "🥩", "🍌", "🧃", "🍰"];

function CategoryForm({
  category,
  onClose,
  onSaved,
}: {
  category?: Category;
  onClose: () => void;
  onSaved: (category: Category) => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function saveCategory() {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const saved = category
        ? await updateCategory(category.id, {
            name: name.trim(),
            description: description.trim(),
          })
        : await createCategory({
            name: name.trim(),
            description: description.trim(),
          });
      onSaved(saved as Category);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to save category.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-layer" role="presentation" onClick={onClose}>
      <div
        className="assign-modal category-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-form-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="drawer-heading">
          <div>
            <span className="eyebrow">Menu organization</span>
            <h2 id="category-form-title">
              {category ? "Edit category" : "Add category"}
            </h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close category form"
          >
            <X />
          </button>
        </div>
        <p className="modal-copy">
          {category
            ? "Update this menu section without affecting its items."
            : "Create a clear section for customers to browse in the menu."}
        </p>
        <label className="field-label">
          Category name
          <input
            className="food-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Breakfast"
          />
        </label>
        <label className="field-label">
          Description
          <textarea
            className="food-input"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="A short description for the category"
          />
        </label>
        <button
          className="primary-button"
          disabled={!name.trim() || saving}
          onClick={() => void saveCategory()}
        >
          {category ? <Check /> : <Plus />}
          {saving ? "Saving..." : category ? "Save changes" : "Add category"}
        </button>
        {error && (
          <p className="login-message" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ShamsiyaCategories() {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formCategory, setFormCategory] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCategories() {
    setLoading(true);
    setError("");
    try {
      setCategories(((await getCategories()) as Category[]) ?? []);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load categories.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  async function deactivateCategory(category: Category) {
    try {
      const updated = await updateCategory(category.id, { is_active: false });
      setCategories((current) =>
        current.map((item) =>
          item.id === category.id ? (updated as Category) : item,
        ),
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to deactivate category.",
      );
    }
  }

  const filtered = useMemo(
    () =>
      categories.filter((category) =>
        `${category.name} ${category.description ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [categories, query],
  );
  const activeCount = categories.filter(
    (category) => category.is_active,
  ).length;

  return (
    <div className="dashboard-app">
      <Sidebar open={open} setOpen={setOpen} />
      <div className="app-canvas">
        <Topbar setOpen={setOpen} />
        <main className="main-content categories-main">
          <div className="page-heading overview-heading">
            <div>
              <div className="eyebrow">
                <span className="live-dot" /> Live menu data
              </div>
              <h1>Categories</h1>
              <p>Organize foods into clear, discoverable menu sections.</p>
            </div>
            <div className="heading-actions">
              <button
                className="primary-button"
                onClick={() => {
                  setFormCategory(null);
                  setFormOpen(true);
                }}
              >
                <FolderPlus /> Add category
              </button>
            </div>
          </div>
          {error && (
            <div className="login-message" role="alert">
              {error}
            </div>
          )}
          <section className="category-summary">
            <div>
              <strong>{categories.length}</strong>
              <span>Menu categories</span>
            </div>
            <div>
              <strong>{activeCount}</strong>
              <span>Active sections</span>
            </div>
            <div>
              <strong>{categories.length - activeCount}</strong>
              <span>Inactive sections</span>
            </div>
            <div className="category-search">
              <Search />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search categories..."
                aria-label="Search categories"
              />
            </div>
          </section>
          {loading ? (
            <div className="auth-checking">
              <p>Loading categories...</p>
            </div>
          ) : filtered.length ? (
            <section className="category-grid">
              {filtered.map((category, index) => (
                <article className="category-card" key={category.id}>
                  <div
                    className={`category-hero ${tones[index % tones.length]}`}
                  >
                    <span>{emojis[index % emojis.length]}</span>
                    <button
                      className="category-more"
                      aria-label={`Edit ${category.name}`}
                      onClick={() => {
                        setFormCategory(category);
                        setFormOpen(true);
                      }}
                    >
                      <Edit3 />
                    </button>
                  </div>
                  <div className="category-card-content">
                    <div className="category-card-heading">
                      <div>
                        <h2>{category.name}</h2>
                        <p>{category.description || "No description added."}</p>
                      </div>
                      <span
                        className={`status-badge ${category.is_active ? "status-success" : "status-pending"}`}
                      >
                        <span />
                        {category.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="category-metrics">
                      <div>
                        <strong>—</strong>
                        <span>Foods</span>
                      </div>
                      <div>
                        <strong>—</strong>
                        <span>Revenue</span>
                      </div>
                      <div>
                        <strong>
                          <Star /> —
                        </strong>
                        <span>Growth</span>
                      </div>
                    </div>
                    <div className="category-card-footer">
                      <button className="text-button">
                        <ShoppingBag /> View foods
                      </button>
                      {category.is_active && (
                        <button
                          className="secondary-button"
                          onClick={() => void deactivateCategory(category)}
                        >
                          <MoreHorizontal /> Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </section>
          ) : (
            <div className="panel empty-state">
              <h2>No categories found</h2>
              <p>
                {query
                  ? "Try a different search."
                  : "Add your first menu category to get started."}
              </p>
            </div>
          )}
          {formOpen && (
            <CategoryForm
              category={formCategory ?? undefined}
              onClose={() => setFormOpen(false)}
              onSaved={() => {
                setFormOpen(false);
                void loadCategories();
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
