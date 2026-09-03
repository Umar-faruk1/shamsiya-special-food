"use client";

import { useEffect, useState } from "react";
import { Check, Clock3, Save, Truck } from "lucide-react";
import ShamsiyaDashboard from "./shamsiya-dashboard";
import {
  getRestaurantSettings,
  updateRestaurantSettings,
  type RestaurantSettings,
} from "@/lib/services/restaurantSettings";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="settings-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      className={`toggle ${value ? "toggle-on" : ""}`}
      onClick={onChange}
      aria-label={`Accepting orders ${value ? "enabled" : "disabled"}`}
      aria-pressed={value}
    >
      <i />
    </button>
  );
}

export default function RestaurantSettingsPage() {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [form, setForm] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadSettings() {
    setLoading(true);
    setError("");
    try {
      const data = await getRestaurantSettings();
      setSettings(data);
      setForm(data);
    } catch (loadError) {
      console.error("[settings] failed to load restaurant settings", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load restaurant settings.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  function updateField<K extends keyof RestaurantSettings>(
    key: K,
    value: RestaurantSettings[K],
  ) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setNotice("");
  }

  const dirty = Boolean(
    settings && form && JSON.stringify(settings) !== JSON.stringify(form),
  );

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings || !form) return;

    const restaurantName = form.restaurant_name.trim();
    const deliveryFee = Number(form.delivery_fee);
    const minimumOrder = Number(form.minimum_order);
    const email = form.email?.trim() ?? "";
    const timePattern = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

    if (!restaurantName) return setError("Restaurant name cannot be empty.");
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0)
      return setError("Delivery fee cannot be negative.");
    if (!Number.isFinite(minimumOrder) || minimumOrder < 0)
      return setError("Minimum order cannot be negative.");
    if (email && !/^\S+@\S+\.\S+$/.test(email))
      return setError("Enter a valid email address.");
    if (form.opening_time && !timePattern.test(form.opening_time))
      return setError("Opening time must be a valid time.");
    if (form.closing_time && !timePattern.test(form.closing_time))
      return setError("Closing time must be a valid time.");

    setSaving(true);
    setError("");
    try {
      const updated = await updateRestaurantSettings(settings.id, {
        restaurant_name: restaurantName,
        description: form.description?.trim() || null,
        logo_url: form.logo_url?.trim() || null,
        phone: form.phone?.trim() || null,
        email: email || null,
        address: form.address?.trim() || null,
        currency: form.currency,
        delivery_fee: deliveryFee,
        minimum_order: minimumOrder,
        opening_time: form.opening_time || null,
        closing_time: form.closing_time || null,
        is_accepting_orders: form.is_accepting_orders,
      });
      setSettings(updated);
      setForm(updated);
      setNotice("Changes saved successfully.");
    } catch (saveError) {
      console.error("[settings] failed to save restaurant settings", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save restaurant settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ShamsiyaDashboard>
      <main className="main-content settings-main">
        <div className="page-heading overview-heading">
          <div>
            <div className="eyebrow">
              <span className="live-dot" /> Workspace preferences
            </div>
            <h1>Restaurant Settings</h1>
            <p>
              Manage the information and ordering rules for your restaurant.
            </p>
          </div>
        </div>
        {loading ? (
          <section className="settings-content panel">
            <div className="settings-section">
              <div className="loading-state">
                Loading restaurant settings...
              </div>
            </div>
          </section>
        ) : error && !form ? (
          <section className="settings-content panel">
            <div className="settings-section">
              <div className="error-state">
                <strong>Unable to load restaurant settings</strong>
                <span>{error}</span>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => void loadSettings()}
                >
                  Try again
                </button>
              </div>
            </div>
          </section>
        ) : form ? (
          <form className="settings-content panel" onSubmit={saveSettings}>
            <div className="panel-header">
              <div>
                <div className="eyebrow">RESTAURANT CONFIGURATION</div>
                <h2>Restaurant Information</h2>
              </div>
              <Save />
            </div>
            <div className="settings-section">
              <div className="settings-form-grid">
                <Field label="Restaurant name">
                  <input
                    value={form.restaurant_name}
                    onChange={(event) =>
                      updateField("restaurant_name", event.target.value)
                    }
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={form.email ?? ""}
                    onChange={(event) =>
                      updateField("email", event.target.value || null)
                    }
                  />
                </Field>
                <Field label="Phone">
                  <input
                    value={form.phone ?? ""}
                    onChange={(event) =>
                      updateField("phone", event.target.value || null)
                    }
                  />
                </Field>
                <Field label="Currency">
                  <input value={form.currency} readOnly aria-readonly="true" />
                </Field>
                <Field label="Logo URL">
                  <input
                    type="url"
                    value={form.logo_url ?? ""}
                    onChange={(event) =>
                      updateField("logo_url", event.target.value || null)
                    }
                  />
                </Field>
                <Field label="Address">
                  <input
                    value={form.address ?? ""}
                    onChange={(event) =>
                      updateField("address", event.target.value || null)
                    }
                  />
                </Field>
              </div>
              <Field label="Description">
                <textarea
                  rows={4}
                  value={form.description ?? ""}
                  onChange={(event) =>
                    updateField("description", event.target.value || null)
                  }
                />
              </Field>
            </div>
            <div className="settings-section">
              <div className="panel-header">
                <div>
                  <div className="eyebrow">ORDERING &amp; DELIVERY</div>
                  <h2>Ordering &amp; Delivery</h2>
                </div>
                <Truck />
              </div>
              <div className="settings-form-grid">
                <Field label="Delivery fee">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.delivery_fee}
                    onChange={(event) =>
                      updateField("delivery_fee", Number(event.target.value))
                    }
                  />
                </Field>
                <Field label="Minimum order">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minimum_order}
                    onChange={(event) =>
                      updateField("minimum_order", Number(event.target.value))
                    }
                  />
                </Field>
              </div>
              <div className="toggle-row">
                <div>
                  <strong>Accepting orders</strong>
                  <small>
                    When disabled, customers should not be able to place new
                    orders once CustomerApp integration is implemented.
                  </small>
                </div>
                <Toggle
                  value={form.is_accepting_orders}
                  onChange={() =>
                    updateField(
                      "is_accepting_orders",
                      !form.is_accepting_orders,
                    )
                  }
                />
              </div>
            </div>
            <div className="settings-section">
              <div className="panel-header">
                <div>
                  <div className="eyebrow">BUSINESS HOURS</div>
                  <h2>Business Hours</h2>
                </div>
                <Clock3 />
              </div>
              <div className="settings-form-grid">
                <Field label="Opening time">
                  <input
                    type="time"
                    value={form.opening_time?.slice(0, 5) ?? ""}
                    onChange={(event) =>
                      updateField("opening_time", event.target.value || null)
                    }
                  />
                </Field>
                <Field label="Closing time">
                  <input
                    type="time"
                    value={form.closing_time?.slice(0, 5) ?? ""}
                    onChange={(event) =>
                      updateField("closing_time", event.target.value || null)
                    }
                  />
                </Field>
              </div>
            </div>
            {error && (
              <div className="error-state settings-section">{error}</div>
            )}
            <div className="settings-save-bar">
              <span>
                {notice ? (
                  <>
                    <Check /> {notice}
                  </>
                ) : dirty ? (
                  "You have unsaved changes."
                ) : (
                  "Settings are up to date."
                )}
              </span>
              <button
                className="primary-button"
                type="submit"
                disabled={saving || !dirty}
              >
                <Save />
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        ) : null}
      </main>
    </ShamsiyaDashboard>
  );
}
