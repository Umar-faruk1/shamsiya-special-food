"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  Clock3,
  CreditCard,
  Eye,
  Globe2,
  LockKeyhole,
  Mail,
  MapPin,
  Plus,
  Search,
  Save,
  Send,
  ShieldCheck,
  Smartphone,
  Trash2,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import ShamsiyaDashboard from "./shamsiya-dashboard";
import {
  createNotification,
  deleteNotification,
  getNotificationRecipients,
  getNotifications,
  updateNotificationReadStatus,
  type NotificationRecipient,
  type NotificationWithRecipient,
} from "@/lib/services/notifications";

const history = [
  [
    "Weekend Jollof promotion",
    "Promotional",
    "All customers",
    "Aug 18, 2025 · 11:42 AM",
    "Delivered",
  ],
  [
    "Kitchen closing early today",
    "Operational",
    "Customers in Accra",
    "Aug 17, 2025 · 4:08 PM",
    "Delivered",
  ],
  [
    "New Mandi Chicken is here",
    "Product update",
    "Food lovers",
    "Aug 15, 2025 · 9:15 AM",
    "Scheduled",
  ],
  [
    "Your order is on the way",
    "Order update",
    "Order #SH-10245",
    "Aug 14, 2025 · 7:22 PM",
    "Delivered",
  ],
];

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
function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: () => void;
}) {
  return (
    <div className="toggle-row">
      <div>
        <strong>{label}</strong>
        <small>{description}</small>
      </div>
      <button
        type="button"
        className={`toggle ${value ? "toggle-on" : ""}`}
        onClick={onChange}
        aria-label={`${label} ${value ? "enabled" : "disabled"}`}
        aria-pressed={value}
      >
        <i />
      </button>
    </div>
  );
}
type NotificationFilter =
  | "all"
  | "read"
  | "unread"
  | "customer"
  | "rider"
  | "admin";

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function recipientLabel(recipient: NotificationRecipient | null) {
  return recipient?.full_name || recipient?.email || "Unknown recipient";
}

function NotificationsPage() {
  const [notifications, setNotifications] = useState<
    NotificationWithRecipient[]
  >([]);
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipientLoading, setRecipientLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [recipientQuery, setRecipientQuery] = useState("");
  const [selected, setSelected] = useState<NotificationWithRecipient | null>(
    null,
  );
  const [confirmDelete, setConfirmDelete] =
    useState<NotificationWithRecipient | null>(null);
  const [form, setForm] = useState({
    user_id: "",
    title: "",
    message: "",
    type: "",
    related_id: "",
  });

  async function loadNotifications() {
    setLoading(true);
    setError("");
    try {
      setNotifications(await getNotifications());
    } catch (loadError) {
      console.error("[notifications] failed to load", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadRecipients() {
    setRecipientLoading(true);
    try {
      setRecipients(await getNotificationRecipients());
    } catch (recipientError) {
      console.error(
        "[notifications] failed to load recipients",
        recipientError,
      );
      setError(
        recipientError instanceof Error
          ? recipientError.message
          : "Unable to load recipients.",
      );
    } finally {
      setRecipientLoading(false);
    }
  }

  useEffect(() => {
    void Promise.all([loadNotifications(), loadRecipients()]);
  }, []);

  const filteredRecipients = recipients.filter((recipient) =>
    `${recipient.full_name ?? ""} ${recipient.email ?? ""} ${recipient.role ?? ""}`
      .toLowerCase()
      .includes(recipientQuery.toLowerCase()),
  );
  const filteredNotifications = notifications.filter((notification) => {
    const recipient = notification.recipient;
    const searchable =
      `${notification.title} ${notification.message} ${recipient?.full_name ?? ""} ${recipient?.email ?? ""}`.toLowerCase();
    const roleMatches =
      filter === "all" || filter === "read" || filter === "unread"
        ? true
        : recipient?.role?.toLowerCase() === filter;
    const readMatches =
      filter === "read"
        ? notification.is_read
        : filter === "unread"
          ? !notification.is_read
          : true;
    return (
      searchable.includes(query.toLowerCase()) && roleMatches && readMatches
    );
  });
  const stats = {
    total: notifications.length,
    unread: notifications.filter((item) => !item.is_read).length,
    read: notifications.filter((item) => item.is_read).length,
    customers: notifications.filter(
      (item) => item.recipient?.role?.toLowerCase() === "customer",
    ).length,
    riders: notifications.filter(
      (item) => item.recipient?.role?.toLowerCase() === "rider",
    ).length,
  };

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = form.title.trim();
    const message = form.message.trim();
    if (!form.user_id) return setError("Select a recipient.");
    if (!title) return setError("Title is required.");
    if (!message) return setError("Message is required.");
    if (
      form.related_id &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        form.related_id.trim(),
      )
    )
      return setError("Related ID must be a valid UUID.");
    setSaving(true);
    setError("");
    try {
      const created = await createNotification({
        user_id: form.user_id,
        title,
        message,
        type: form.type || null,
        related_id: form.related_id.trim() || null,
        is_read: false,
      });
      setNotifications((current) => [created, ...current]);
      setForm({
        user_id: "",
        title: "",
        message: "",
        type: "",
        related_id: "",
      });
      setRecipientQuery("");
      setShowCreate(false);
      setNotice("Notification created successfully.");
    } catch (createError) {
      console.error("[notifications] failed to create", createError);
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create notification.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleRead(notification: NotificationWithRecipient) {
    try {
      const updated = await updateNotificationReadStatus(
        notification.id,
        !notification.is_read,
      );
      setNotifications((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setNotice(
        updated.is_read
          ? "Notification marked as read."
          : "Notification marked as unread.",
      );
    } catch (updateError) {
      console.error(
        "[notifications] failed to update read status",
        updateError,
      );
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update notification.",
      );
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      await deleteNotification(confirmDelete.id);
      setNotifications((current) =>
        current.filter((item) => item.id !== confirmDelete.id),
      );
      setConfirmDelete(null);
      setNotice("Notification deleted successfully.");
    } catch (deleteError) {
      console.error("[notifications] failed to delete", deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete notification.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ShamsiyaDashboard>
      <main className="main-content notifications-main">
        <div className="page-heading overview-heading">
          <div>
            <div className="eyebrow">
              <span className="live-dot" /> Customer communication
            </div>
            <h1>Notifications</h1>
            <p>
              Manage notification records for customers, riders, and admins.
            </p>
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              setError("");
              setShowCreate(true);
            }}
          >
            <Plus /> Create notification
          </button>
        </div>
        {notice && (
          <div className="success-note notification-notice">
            <Check /> {notice}
          </div>
        )}
        {error && (
          <div className="error-state notification-notice">
            <strong>{error}</strong>
          </div>
        )}
        <section className="stats-grid notification-stats">
          {[
            ["Total notifications", stats.total],
            ["Unread notifications", stats.unread],
            ["Read notifications", stats.read],
            ["Customer notifications", stats.customers],
            ["Rider notifications", stats.riders],
          ].map(([label, value]) => (
            <article className="stat-card" key={label}>
              <div className="stat-head">
                <span>{label}</span>
                <Bell />
              </div>
              <strong className="stat-value">{value}</strong>
            </article>
          ))}
        </section>
        <section className="panel notification-history">
          <div className="panel-header">
            <div>
              <div className="eyebrow">NOTIFICATION RECORDS</div>
              <h2>All notifications</h2>
            </div>
            <span className="panel-count">
              {filteredNotifications.length} shown
            </span>
          </div>
          <div className="notification-toolbar">
            <label className="notification-search">
              <Search />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, message, name, or email"
              />
            </label>
            <div className="notification-filters">
              {(
                [
                  ["all", "All"],
                  ["read", "Read"],
                  ["unread", "Unread"],
                  ["customer", "Customers"],
                  ["rider", "Riders"],
                  ["admin", "Admins"],
                ] as const
              ).map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={filter === value ? "filter-active" : ""}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="settings-section">
              <div className="loading-state">Loading notifications...</div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="panel empty-state">
              <Bell />
              <strong>
                {notifications.length === 0
                  ? "No notifications yet"
                  : "No matching notifications"}
              </strong>
              <span>
                {notifications.length === 0
                  ? "Create a notification to begin managing customer communication."
                  : "Try a different search or filter."}
              </span>
            </div>
          ) : (
            <div className="settings-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Notification</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotifications.map((notification) => (
                    <tr key={notification.id}>
                      <td>
                        <strong>
                          {recipientLabel(notification.recipient)}
                        </strong>
                        <small>
                          {notification.recipient?.email ?? ""} ·{" "}
                          {notification.recipient?.role ?? "Unknown role"}
                        </small>
                      </td>
                      <td>
                        <strong>{notification.title}</strong>
                        <small>{notification.message}</small>
                      </td>
                      <td>{notification.type || "General"}</td>
                      <td>
                        <span
                          className={`status-badge ${notification.is_read ? "status-success" : "status-info"}`}
                        >
                          <span />
                          {notification.is_read ? "Read" : "Unread"}
                        </span>
                      </td>
                      <td>{formatNotificationDate(notification.created_at)}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="icon-button"
                            type="button"
                            title="View details"
                            onClick={() => setSelected(notification)}
                          >
                            <Eye />
                          </button>
                          <button
                            className="icon-button"
                            type="button"
                            title={
                              notification.is_read ? "Mark unread" : "Mark read"
                            }
                            onClick={() => void toggleRead(notification)}
                          >
                            <Check />
                          </button>
                          <button
                            className="icon-button"
                            type="button"
                            title="Delete notification"
                            onClick={() => setConfirmDelete(notification)}
                          >
                            <Trash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      {showCreate && (
        <div className="modal-layer" onClick={() => setShowCreate(false)}>
          <div
            className="assign-modal notification-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="drawer-heading">
              <div>
                <div className="eyebrow">NEW RECORD</div>
                <h2>Create notification</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                title="Close"
                onClick={() => setShowCreate(false)}
              >
                <X />
              </button>
            </div>
            <form className="notification-form" onSubmit={handleCreate}>
              <Field label="Recipient">
                <input
                  placeholder="Search name, email, or role"
                  value={recipientQuery}
                  onChange={(event) => setRecipientQuery(event.target.value)}
                />
                {recipientLoading ? (
                  <small>Loading recipients...</small>
                ) : (
                  <select
                    required
                    value={form.user_id}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        user_id: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select a recipient</option>
                    {filteredRecipients.map((recipient) => (
                      <option key={recipient.id} value={recipient.id}>
                        {recipientLabel(recipient)} · {recipient.email ?? ""} ·{" "}
                        {recipient.role ?? ""}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Title">
                <input
                  required
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Message">
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      message: event.target.value,
                    }))
                  }
                />
              </Field>
              <div className="settings-form-grid">
                <Field label="Type">
                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        type: event.target.value,
                      }))
                    }
                  >
                    <option value="">None</option>
                    {[
                      "order",
                      "promotion",
                      "payment",
                      "delivery",
                      "system",
                      "general",
                    ].map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Related ID (optional)">
                  <input
                    value={form.related_id}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        related_id: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
              <div className="confirm-modal-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={saving}
                >
                  <Send />
                  {saving ? "Creating..." : "Create notification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {selected && (
        <div className="modal-layer" onClick={() => setSelected(null)}>
          <aside
            className="order-drawer"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="drawer-heading">
              <div>
                <div className="eyebrow">NOTIFICATION DETAILS</div>
                <h2>{selected.title}</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                title="Close"
                onClick={() => setSelected(null)}
              >
                <X />
              </button>
            </div>
            <div className="drawer-block">
              <h3>Recipient</h3>
              <p className="drawer-line">
                {recipientLabel(selected.recipient)}
              </p>
              <p className="drawer-note">
                {selected.recipient?.email ?? "No email"} ·{" "}
                {selected.recipient?.role ?? "Unknown role"}
              </p>
            </div>
            <div className="drawer-block">
              <h3>Message</h3>
              <p className="drawer-note">{selected.message}</p>
            </div>
            <div className="drawer-block">
              <h3>Record</h3>
              <p className="drawer-note">
                Type: {selected.type || "None"}
                <br />
                Related ID: {selected.related_id || "None"}
                <br />
                Status: {selected.is_read ? "Read" : "Unread"}
                <br />
                Created: {formatNotificationDate(selected.created_at)}
              </p>
            </div>
          </aside>
        </div>
      )}
      {confirmDelete && (
        <div className="modal-layer" onClick={() => setConfirmDelete(null)}>
          <div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="confirm-modal-head">
              <Trash2 />
              <h3>Delete notification?</h3>
            </div>
            <p className="modal-copy">
              This notification will be permanently removed.
            </p>
            <div className="confirm-modal-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={() => void handleDelete()}
                disabled={saving}
              >
                {saving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ShamsiyaDashboard>
  );
}

const sections = [
  "General",
  "Business hours",
  "Delivery",
  "Payment methods",
  "AI management",
  "Notifications",
  "Security",
];
function SettingsPage() {
  const [section, setSection] = useState("General");
  const [saved, setSaved] = useState(false);
  const [toggles, setToggles] = useState({
    email: true,
    push: true,
    sms: false,
    recommendations: true,
  });
  const flip = (key: keyof typeof toggles) =>
    setToggles((t) => ({ ...t, [key]: !t[key] }));
  return (
    <ShamsiyaDashboard>
      <main className="main-content settings-main">
        <div className="page-heading overview-heading">
          <div>
            <div className="eyebrow">
              <span className="live-dot" /> Workspace preferences
            </div>
            <h1>Settings</h1>
            <p>Configure how Shamsiya works for your team and customers.</p>
          </div>
        </div>
        <div className="settings-layout">
          <aside className="panel settings-nav">
            <div className="settings-account">
              <div className="avatar avatar-large">SA</div>
              <div>
                <strong>Shamsiya Admin</strong>
                <span>Owner account</span>
              </div>
            </div>
            {sections.map((item) => (
              <button
                type="button"
                key={item}
                className={section === item ? "settings-nav-active" : ""}
                onClick={() => setSection(item)}
                aria-current={section === item ? "page" : undefined}
              >
                {item === "General" ? (
                  <Globe2 />
                ) : item === "Business hours" ? (
                  <Clock3 />
                ) : item === "Delivery" ? (
                  <Truck />
                ) : item === "Payment methods" ? (
                  <CreditCard />
                ) : item === "AI management" ? (
                  <ShieldCheck />
                ) : item === "Notifications" ? (
                  <Bell />
                ) : (
                  <LockKeyhole />
                )}
                {item}
              </button>
            ))}
          </aside>
          <section className="settings-content panel">
            <div className="panel-header">
              <div>
                <div className="eyebrow">{section.toUpperCase()}</div>
                <h2>{section}</h2>
              </div>
              <Save />
            </div>
            {section === "General" && (
              <div className="settings-section">
                <div className="settings-form-grid">
                  <Field label="Restaurant name">
                    <input defaultValue="Shamsiya Kitchen" />
                  </Field>
                  <Field label="Support email">
                    <input defaultValue="hello@shamsiya.co" />
                  </Field>
                  <Field label="Phone number">
                    <input defaultValue="+233 24 555 0184" />
                  </Field>
                  <Field label="Currency">
                    <select defaultValue="GHS">
                      <option value="GHS">Ghanaian Cedi (GH₵)</option>
                      <option>US Dollar ($)</option>
                    </select>
                  </Field>
                  <Field label="Address">
                    <input defaultValue="14 Independence Avenue, Accra" />
                  </Field>
                  <Field label="Timezone">
                    <select>
                      <option>GMT +00:00 · Accra</option>
                      <option>GMT +01:00 · Lagos</option>
                    </select>
                  </Field>
                </div>
                <Field label="About your restaurant">
                  <textarea
                    rows={4}
                    defaultValue="A modern kitchen serving generous West African comfort food with a Shamsiya twist."
                  />
                </Field>
              </div>
            )}
            {section === "Business hours" && (
              <div className="settings-section hours-list">
                {[
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ].map((day) => (
                  <div className="hours-row" key={day}>
                    <strong>{day}</strong>
                    <select>
                      <option>Open</option>
                      <option>Closed</option>
                    </select>
                    <input defaultValue="10:00 AM" />
                    <span>to</span>
                    <input defaultValue="10:00 PM" />
                  </div>
                ))}
              </div>
            )}
            {section === "Delivery" && (
              <div className="settings-section">
                <div className="settings-form-grid">
                  <Field label="Delivery radius">
                    <input defaultValue="15 km" />
                  </Field>
                  <Field label="Base delivery fee">
                    <input defaultValue="GH₵15.00" />
                  </Field>
                  <Field label="Estimated delivery time">
                    <input defaultValue="35–45 minutes" />
                  </Field>
                  <Field label="Free delivery threshold">
                    <input defaultValue="GH₵150.00" />
                  </Field>
                </div>
                <Toggle
                  label="Accept scheduled orders"
                  description="Let customers choose a future delivery time."
                  value={toggles.push}
                  onChange={() => flip("push")}
                />
                <Toggle
                  label="Auto-assign riders"
                  description="Assign the nearest available rider to new orders."
                  value={toggles.recommendations}
                  onChange={() => flip("recommendations")}
                />
              </div>
            )}
            {section === "Payment methods" && (
              <div className="settings-section">
                <div className="payment-method-card">
                  <CreditCard />
                  <div>
                    <strong>Mobile Money</strong>
                    <small>MTN MoMo · ending in 0184</small>
                  </div>
                  <span className="status-badge status-success">
                    <span />
                    Connected
                  </span>
                </div>
                <div className="payment-method-card">
                  <CreditCard />
                  <div>
                    <strong>Paystack</strong>
                    <small>Cards and bank transfers</small>
                  </div>
                  <span className="status-badge status-success">
                    <span />
                    Connected
                  </span>
                </div>
                <button className="secondary-button">
                  <CreditCard />
                  Add payment method
                </button>
              </div>
            )}
            {section === "AI management" && (
              <div className="settings-section">
                <Toggle
                  label="AI recommendations"
                  description="Use order history to personalise meal suggestions."
                  value={toggles.recommendations}
                  onChange={() => flip("recommendations")}
                />
                <Toggle
                  label="Image recognition"
                  description="Automatically identify food items in uploaded menu images."
                  value={toggles.email}
                  onChange={() => flip("email")}
                />
                <Toggle
                  label="Conversation assistant"
                  description="Let the Shamsiya assistant answer common customer questions."
                  value={toggles.push}
                  onChange={() => flip("push")}
                />
              </div>
            )}
            {section === "Notifications" && (
              <div className="settings-section">
                <Toggle
                  label="Email notifications"
                  description="Receive operational summaries and account alerts by email."
                  value={toggles.email}
                  onChange={() => flip("email")}
                />
                <Toggle
                  label="Push notifications"
                  description="Get real-time order and rider updates in your dashboard."
                  value={toggles.push}
                  onChange={() => flip("push")}
                />
                <Toggle
                  label="SMS notifications"
                  description="Send critical order updates to the admin phone number."
                  value={toggles.sms}
                  onChange={() => flip("sms")}
                />
              </div>
            )}
            {section === "Security" && (
              <div className="settings-section">
                <div className="security-card">
                  <ShieldCheck />
                  <div>
                    <strong>Your account is protected</strong>
                    <span>
                      Two-factor authentication is enabled for this workspace.
                    </span>
                  </div>
                </div>
                <button className="secondary-button">
                  <LockKeyhole />
                  Change password
                </button>
                <button className="secondary-button">
                  <UserRound />
                  Manage team access
                </button>
              </div>
            )}
            <div className="settings-save-bar">
              <span>
                {saved ? (
                  <>
                    <Check /> Changes saved successfully
                  </>
                ) : (
                  "Changes are saved to this workspace."
                )}
              </span>
              <button
                className="primary-button"
                onClick={() => {
                  setSaved(true);
                  setTimeout(() => setSaved(false), 2200);
                }}
              >
                <Save />
                Save changes
              </button>
            </div>
          </section>
        </div>
      </main>
    </ShamsiyaDashboard>
  );
}

export { NotificationsPage, SettingsPage };
