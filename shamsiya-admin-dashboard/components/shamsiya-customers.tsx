"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock3,
  CreditCard,
  Eye,
  Mail,
  MapPin,
  MoreHorizontal,
  Plus,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  createCustomer,
  getCustomer,
  getCustomerAddresses,
  getCustomerOrders,
  getCustomers,
  getCustomerListStats,
  getCustomerStats,
  updateCustomerStatus,
  type Customer,
  type CustomerAddress,
  type CustomerOrder,
  type CustomerListStats,
  type CustomerStats,
} from "@/lib/services/customers";

const money = (value: number) =>
  `GHS ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const readable = (value: string | null | undefined) =>
  value?.trim() || "Not available";
const statusLabel = (value: string | null | undefined) =>
  readable(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
const statusClass = (value: string | null | undefined) =>
  value === "active"
    ? "status-success"
    : value === "blocked"
      ? "status-pending"
      : "status-neutral";

function Avatar({
  customer,
  large = false,
}: {
  customer: Customer;
  large?: boolean;
}) {
  const name = readable(customer.full_name);
  return customer.avatar_url ? (
    <img
      className={`avatar ${large ? "avatar-lg" : ""}`}
      src={customer.avatar_url}
      alt={name}
    />
  ) : (
    <div className={`avatar rider-avatar ${large ? "avatar-lg" : ""}`}>
      {name === "Not available" ? "C" : name.slice(0, 2).toUpperCase()}
    </div>
  );
}
function CustomerStatus({ value }: { value: string | null }) {
  return (
    <span className={`status-badge ${statusClass(value)}`}>
      <span />
      {statusLabel(value)}
    </span>
  );
}
function errorText(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "42501"
  )
    return "You do not have permission to manage customers.";
  return error instanceof Error ? error.message : fallback;
}

function ConfirmStatus({
  customer,
  nextStatus,
  busy,
  onCancel,
  onConfirm,
}: {
  customer: Customer;
  nextStatus: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-layer" onClick={onCancel}>
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="confirm-modal-head">
          <Users />
          <h3>
            {nextStatus === "active"
              ? "Activate customer?"
              : "Deactivate customer?"}
          </h3>
        </div>
        <p className="modal-copy">
          {readable(customer.full_name)} will{" "}
          {nextStatus === "active"
            ? "be able to use their customer account again."
            : "no longer be able to use their customer account."}
        </p>
        <div className="confirm-modal-actions">
          <button
            className="secondary-button"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            className="primary-button"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy
              ? "Updating..."
              : nextStatus === "active"
                ? "Activate"
                : "Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stats({
  customers,
  loading,
}: {
  customers: Customer[];
  loading: boolean;
}) {
  const newCustomers = customers.filter(
    (customer) =>
      Date.now() - new Date(customer.created_at).getTime() <=
      30 * 24 * 60 * 60 * 1000,
  ).length;
  const cards = [
    [Users, "Total Customers", customers.length],
    [
      Check,
      "Active Customers",
      customers.filter((customer) => customer.status === "active").length,
    ],
    [
      Clock3,
      "Inactive Customers",
      customers.filter((customer) => customer.status !== "active").length,
    ],
    [UserRound, "New Customers", newCustomers],
  ] as const;
  return (
    <section className="stats-grid customer-stats">
      {cards.map(([Icon, title, value]) => (
        <article className="stat-card" key={title}>
          <div className="stat-head">
            <span>{title}</span>
            <div className="stat-icon">
              <Icon />
            </div>
          </div>
          <div className="stat-value">{loading ? "..." : value}</div>
          <div className="stat-foot">
            <span>Live</span>
            <span>from database</span>
          </div>
        </article>
      ))}
    </section>
  );
}

function AddCustomerModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [values, setValues] = useState({
    full_name: "",
    email: "",
    phone: "",
    status: "active",
  });
  const [errors, setErrors] = useState<{
    full_name?: string;
    email?: string;
    phone?: string;
  }>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function change(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const fullName = values.full_name.trim();
    const email = values.email.trim().toLowerCase();
    const phone = values.phone.trim();
    const nextErrors: typeof errors = {};
    if (fullName.length < 2)
      nextErrors.full_name = "Enter at least 2 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      nextErrors.email = "Enter a valid email address.";
    if (!phone) nextErrors.phone = "Phone number is required.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await createCustomer({ ...values, full_name: fullName, email, phone });
      await onCreated();
      onClose();
    } catch (reason) {
      setError(
        reason instanceof Error && reason.message.includes("already exists")
          ? "A customer account with this email already exists."
          : reason instanceof Error
            ? reason.message
            : "Unable to create customer account.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-layer" onClick={onClose}>
      <form
        className="assign-modal customer-form-modal"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        onSubmit={submit}
      >
        <div className="drawer-heading">
          <div>
            <span className="eyebrow">Customer management</span>
            <h2>Add Customer</h2>
            <p className="modal-copy">
              Create a new customer account for Shamsiya Special Food.
            </p>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Close"
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        <div className="customer-form-grid">
          <label>
            Full name
            <input
              autoFocus
              value={values.full_name}
              onChange={(event) => change("full_name", event.target.value)}
              aria-invalid={!!errors.full_name}
              placeholder="e.g. Ama Boateng"
            />
            {errors.full_name && (
              <small className="field-error">{errors.full_name}</small>
            )}
          </label>
          <label>
            Email
            <input
              type="email"
              value={values.email}
              onChange={(event) => change("email", event.target.value)}
              aria-invalid={!!errors.email}
              placeholder="customer@example.com"
            />
            {errors.email && (
              <small className="field-error">{errors.email}</small>
            )}
          </label>
          <label>
            Phone number
            <input
              required
              value={values.phone}
              onChange={(event) => change("phone", event.target.value)}
              aria-invalid={!!errors.phone}
              placeholder="024 000 0000"
            />
            {errors.phone && (
              <small className="field-error">{errors.phone}</small>
            )}
          </label>
          <label>
            Status
            <select
              value={values.status}
              onChange={(event) => change("status", event.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>
        {error && (
          <p className="login-message" role="alert">
            {error}
          </p>
        )}
        <div className="confirm-modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={busy}>
            {busy ? (
              "Creating customer..."
            ) : (
              <>
                <Plus /> Create Customer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function CustomerList({ onSelect }: { onSelect: (id: string) => void }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [listStats, setListStats] = useState<CustomerListStats>({});
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const load = async (refresh = false) => {
    console.log("[customers page] load: started", { refresh });
    refresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const nextCustomers = await getCustomers();
      console.log("[customers page] customers loaded", {
        count: nextCustomers.length,
        customers: nextCustomers,
      });
      setCustomers(nextCustomers);
      setListStats(
        await getCustomerListStats(
          nextCustomers.map((customer) => customer.id),
        ),
      );
    } catch (reason) {
      console.error("[customers page] load: failed", reason);
      setError(errorText(reason, "Unable to load customers."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const statusValues = Array.from(
    new Set(
      customers
        .map((customer) => customer.status)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const result = customers.filter(
      (customer) =>
        (!term ||
          [customer.full_name, customer.email, customer.phone]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(term)) &&
        (status === "all" || customer.status === status),
    );
    console.log("[customers page] filtered customers", {
      total: customers.length,
      visible: result.length,
      filters: { query, status },
    });
    return result;
  }, [customers, query, status]);
  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  }
  return (
    <main className="main-content customers-main">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> Customer management
          </div>
          <h1>Customers</h1>
          <p>Manage registered customers, accounts and customer activity.</p>
        </div>
        <div className="heading-actions">
          <button
            className="primary-button"
            onClick={() => setAddCustomerOpen(true)}
          >
            <Plus /> Add Customer
          </button>
          <button
            className="secondary-button"
            onClick={() => void load(true)}
            disabled={refreshing}
          >
            <RefreshCw /> {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>
      <Stats customers={customers} loading={loading} />
      {error && (
        <div className="login-message" role="alert">
          {error}{" "}
          <button className="text-button" onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}
      <section className="panel customer-table-panel">
        <div className="customers-toolbar">
          <div className="customers-search">
            <Search />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search customers..."
              aria-label="Search customers"
            />
          </div>
          <div className="customers-filters">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Customer status"
            >
              <option value="all">All status</option>
              {statusValues.map((value) => (
                <option key={value} value={value}>
                  {statusLabel(value)}
                </option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
          <div className="auth-checking">
            <p>Loading customers...</p>
          </div>
        ) : (
          <div className="customers-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <button
                        className="customer-name-link"
                        onClick={() => onSelect(customer.id)}
                      >
                        <Avatar customer={customer} />
                        <span>
                          <strong>{readable(customer.full_name)}</strong>
                        </span>
                      </button>
                    </td>
                    <td>{readable(customer.email)}</td>
                    <td>{readable(customer.phone)}</td>
                    <td>{listStats[customer.id]?.totalOrders ?? 0}</td>
                    <td>{money(listStats[customer.id]?.totalSpent ?? 0)}</td>
                    <td>
                      <CustomerStatus value={customer.status} />
                    </td>
                    <td>
                      {new Date(customer.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={`View ${readable(customer.full_name)}`}
                        onClick={() => onSelect(customer.id)}
                      >
                        <Eye />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && (
              <div className="empty-customers">
                <Search />
                <strong>
                  {customers.length
                    ? "No customers match your search."
                    : "No customers found"}
                </strong>
                <span>
                  {customers.length
                    ? "Try a different name, email or phone number."
                    : "No customer accounts are available."}
                </span>
              </div>
            )}
            <div className="panel-footer">
              <span>
                Showing {filtered.length} of {customers.length} customers
              </span>
            </div>
          </div>
        )}
      </section>
      {toast && (
        <div className="toast-message">
          <Check />
          {toast}
        </div>
      )}
      {addCustomerOpen && (
        <AddCustomerModal
          onClose={() => setAddCustomerOpen(false)}
          onCreated={async () => {
            await load(true);
            notify("Customer created successfully.");
          }}
        />
      )}
    </main>
  );
}

function CustomerProfile({ id, onBack }: { id: string; onBack: () => void }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  useEffect(() => {
    Promise.all([
      getCustomer(id),
      getCustomerOrders(id),
      getCustomerAddresses(id),
      getCustomerStats(id),
    ])
      .then(([profile, customerOrders, customerAddresses, customerStats]) => {
        setCustomer(profile);
        setOrders(customerOrders);
        setAddresses(customerAddresses);
        setStats(customerStats);
      })
      .catch((reason) =>
        setError(errorText(reason, "Unable to load customer details.")),
      )
      .finally(() => setLoading(false));
  }, [id]);
  if (loading)
    return (
      <main className="main-content">
        <div className="auth-checking">
          <p>Loading customer details...</p>
        </div>
      </main>
    );
  if (!customer)
    return (
      <main className="main-content">
        <div className="panel empty-state">
          <p>{error || "Customer not found."}</p>
          <button className="secondary-button" onClick={onBack}>
            Back to customers
          </button>
        </div>
      </main>
    );
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  };
  async function changeStatus() {
    if (!confirm) return;
    if (!customer) return;
    const currentCustomer = customer;
    setBusy(true);
    try {
      await updateCustomerStatus(currentCustomer.id, confirm);
      setCustomer({ ...currentCustomer, status: confirm });
      notify("Customer status updated successfully.");
      setConfirm(null);
    } catch (reason) {
      setError(errorText(reason, "Unable to update customer status."));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="main-content customer-profile-main">
      <div className="profile-back">
        <button className="text-button" onClick={onBack}>
          <ArrowLeft /> Back to customers
        </button>
        <span>Customers / {readable(customer.full_name)}</span>
      </div>
      <section className="panel customer-profile-hero">
        <div className="profile-hero-main">
          <Avatar customer={customer} large />
          <div>
            <div className="profile-title-line">
              <h1>{readable(customer.full_name)}</h1>
              <CustomerStatus value={customer.status} />
            </div>
            <p>{readable(customer.email)}</p>
            <div className="profile-contact">
              <span>
                <Phone /> {readable(customer.phone)}
              </span>
              <span>
                <Clock3 /> Joined{" "}
                {new Date(customer.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="profile-hero-actions">
          <button
            className={`secondary-button ${customer.status === "active" ? "suspend-action" : "activate-action"}`}
            onClick={() =>
              setConfirm(customer.status === "active" ? "inactive" : "active")
            }
          >
            <Users /> {customer.status === "active" ? "Deactivate" : "Activate"}
          </button>
        </div>
      </section>
      <section className="profile-stats">
        <div>
          <ShoppingBag />
          <span>Total orders</span>
          <strong>{stats?.totalOrders ?? 0}</strong>
        </div>
        <div>
          <Check />
          <span>Completed orders</span>
          <strong>{stats?.completedOrders ?? 0}</strong>
        </div>
        <div>
          <X />
          <span>Cancelled orders</span>
          <strong>{stats?.cancelledOrders ?? 0}</strong>
        </div>
        <div>
          <CreditCard />
          <span>Total spent</span>
          <strong>{money(stats?.totalSpent ?? 0)}</strong>
        </div>
      </section>
      <div className="profile-layout">
        <section className="panel profile-content">
          <div className="profile-overview">
            <h2 className="profile-subheading">Customer information</h2>
            <div className="info-list">
              <p>
                <Mail />
                <span>
                  <small>Email address</small>
                  {readable(customer.email)}
                </span>
              </p>
              <p>
                <Phone />
                <span>
                  <small>Phone number</small>
                  {readable(customer.phone)}
                </span>
              </p>
              <p>
                <Clock3 />
                <span>
                  <small>Last updated</small>
                  {new Date(customer.updated_at).toLocaleString()}
                </span>
              </p>
            </div>
            <h2 className="profile-subheading recent-heading">Order history</h2>
            {orders.length ? (
              orders.map((order) => (
                <div className="profile-order-row" key={order.id}>
                  <span>
                    <strong>#{order.order_number}</strong>
                    <small>{new Date(order.created_at).toLocaleString()}</small>
                  </span>
                  <b>{money(Number(order.total))}</b>
                  <span
                    className={`status-badge ${order.status === "delivered" ? "status-success" : "status-neutral"}`}
                  >
                    <span />
                    {statusLabel(order.status)}
                  </span>
                </div>
              ))
            ) : (
              <p className="drawer-note">No orders found.</p>
            )}
            <h2 className="profile-subheading recent-heading">
              Saved addresses
            </h2>
            {addresses.length ? (
              addresses.map((address, index) => (
                <div
                  className="profile-order-row"
                  key={String(address.id ?? index)}
                >
                  <span>
                    <strong>{readable(address.label)}</strong>
                    <small>
                      {readable(address.address)}
                      {address.city ? `, ${address.city}` : ""}
                    </small>
                  </span>
                  <small>
                    {address.is_default || address.default
                      ? "Default address"
                      : ""}
                  </small>
                </div>
              ))
            ) : (
              <p className="drawer-note">No saved addresses.</p>
            )}
          </div>
        </section>
        <aside className="panel profile-side">
          <h2 className="profile-subheading">Account</h2>
          <p className="drawer-note">
            Registered {new Date(customer.created_at).toLocaleString()}
            <br />
            Updated {new Date(customer.updated_at).toLocaleString()}
          </p>
          <button
            className="profile-action-button"
            onClick={() => notify("Customer email action is ready")}
          >
            <Mail />
            <span>
              <strong>Contact customer</strong>
              <small>{readable(customer.email)}</small>
            </span>
            <ChevronRight />
          </button>
        </aside>
      </div>
      {confirm && (
        <ConfirmStatus
          customer={customer}
          nextStatus={confirm}
          busy={busy}
          onCancel={() => setConfirm(null)}
          onConfirm={() => void changeStatus()}
        />
      )}
      {toast && (
        <div className="toast-message">
          <Check />
          {toast}
        </div>
      )}
    </main>
  );
}

export default function ShamsiyaCustomers({ detailId }: { detailId?: string }) {
  const [selected, setSelected] = useState(detailId);
  return selected ? (
    <CustomerProfile id={selected} onBack={() => setSelected(undefined)} />
  ) : (
    <CustomerList onSelect={setSelected} />
  );
}
