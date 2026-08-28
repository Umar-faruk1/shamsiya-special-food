"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Bike,
  Check,
  Clock3,
  Eye,
  Filter,
  Map,
  MapPin,
  MoreHorizontal,
  Navigation,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Star,
  X,
  Users,
} from "lucide-react";
import ShamsiyaDashboard from "./shamsiya-dashboard";
import {
  createRider,
  getRider,
  getRiderOrders,
  getRiders,
  getRiderStats,
  updateRiderApprovalStatus,
  updateRiderProfile,
  updateRiderStatus,
  getAvailableRiders,
  type Rider,
  type RiderOrder,
  type RiderStats as RiderStatsData,
} from "@/lib/services/riders";
import { assignRider } from "@/lib/services/orders";
import { supabase } from "@/lib/supabase/client";

export type RiderAssignmentOrder = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  delivery_address: string | null;
  customer?: { full_name: string | null; phone: string | null } | null;
};

const approvalLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};
const riderStatusLabels: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
};
const orderStatusLabels: Record<string, string> = {
  ready_for_pickup: "Ready for Pickup",
  rider_assigned: "Rider Assigned",
  rider_accepted: "Rider Accepted",
  picked_up: "Picked Up",
  out_for_delivery: "Out for Delivery",
  arrived: "Arrived",
  delivered: "Delivered",
  cancelled: "Cancelled",
  failed: "Failed",
};
const money = (value: number | null | undefined) =>
  `GHS ${Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString() : "Not available";
const label = (value: string | null | undefined) =>
  value
    ? value
        .replace(/_/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase())
    : "Not available";

function errorMessage(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "42501"
  )
    return "You do not have permission to manage riders.";
  return error instanceof Error ? error.message : fallback;
}

export function ApprovalStatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`status-badge ${value === "approved" ? "status-success" : value === "pending" ? "status-pending" : "status-neutral"}`}
    >
      <span />
      {approvalLabels[value] ?? label(value)}
    </span>
  );
}
export function RiderStatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`status-badge ${value === "active" ? "status-success" : "status-neutral"}`}
    >
      <span />
      {riderStatusLabels[value] ?? label(value)}
    </span>
  );
}
export function OnlineStatusBadge({ online }: { online: boolean }) {
  return (
    <span
      className={`status-badge ${online ? "status-success" : "status-neutral"}`}
    >
      <span />
      {online ? "Online" : "Offline"}
    </span>
  );
}

function Avatar({
  rider,
  large = false,
}: {
  rider?: Rider | null;
  large?: boolean;
}) {
  const name = rider?.profile?.full_name ?? "Rider";
  return rider?.profile?.avatar_url ? (
    <img
      className={`avatar ${large ? "avatar-lg" : ""}`}
      src={rider.profile.avatar_url}
      alt={name}
    />
  ) : (
    <div className={`avatar rider-avatar ${large ? "avatar-lg" : ""}`}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function displayProfileValue(
  value: string | null | undefined,
  fallback: string,
) {
  return value?.trim() ? value : fallback;
}

function ConfirmDialog({
  action,
  busy,
  onCancel,
  onConfirm,
}: {
  action: { title: string; message: string; label: string } | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!action) return null;
  return (
    <div className="modal-layer" onClick={onCancel}>
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="confirm-modal-head">
          <AlertTriangle />
          <h3>{action.title}</h3>
        </div>
        <p className="modal-copy">{action.message}</p>
        <div className="confirm-modal-actions">
          <button
            className="secondary-button"
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="primary-button"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "Updating..." : action.label}
          </button>
        </div>
      </div>
    </div>
  );
}

export function RiderStats({
  stats,
  loading,
}: {
  stats: RiderStatsData | null;
  loading: boolean;
}) {
  const cards = [
    [Users, "Total riders", stats?.total],
    [ShieldCheck, "Approved riders", stats?.approved],
    [Clock3, "Pending approval", stats?.pending],
    [Navigation, "Online riders", stats?.online],
    [MapPin, "Offline riders", stats?.offline],
    [Bike, "Active riders", stats?.active],
  ] as const;
  return (
    <section className="stats-grid rider-stats">
      {cards.map(([Icon, title, value]) => (
        <article className="stat-card" key={title}>
          <div className="stat-head">
            <span>{title}</span>
            <div className="stat-icon">
              <Icon />
            </div>
          </div>
          <div className="stat-value">{loading ? "..." : (value ?? 0)}</div>
          <div className="stat-foot">
            <span>Live</span>
            <span>from database</span>
          </div>
        </article>
      ))}
    </section>
  );
}

export function RiderDetailsDrawer({
  riderId,
  onClose,
  onChanged,
}: {
  riderId: string;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const [rider, setRider] = useState<Rider | null>(null);
  const [orders, setOrders] = useState<RiderOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([getRider(riderId), getRiderOrders(riderId)])
      .then(([nextRider, nextOrders]) => {
        setRider(nextRider);
        setOrders(nextOrders);
      })
      .catch((reason) =>
        setError(errorMessage(reason, "Unable to load rider details.")),
      )
      .finally(() => setLoading(false));
  }, [riderId]);
  if (loading)
    return (
      <div className="modal-layer">
        <aside className="order-drawer">
          <p>Loading rider details...</p>
        </aside>
      </div>
    );
  if (!rider)
    return (
      <div className="modal-layer" onClick={onClose}>
        <aside
          className="order-drawer"
          onClick={(event) => event.stopPropagation()}
        >
          <p className="login-message">{error || "Rider not found."}</p>
          <button className="secondary-button" onClick={onClose}>
            Close
          </button>
        </aside>
      </div>
    );
  const completed = orders.filter((order) => order.status === "delivered");
  const cancelled = orders.filter((order) => order.status === "cancelled");
  const failed = orders.filter((order) => order.status === "failed");
  const active = orders.filter((order) =>
    [
      "rider_assigned",
      "rider_accepted",
      "picked_up",
      "out_for_delivery",
      "arrived",
    ].includes(order.status),
  );
  return (
    <div className="modal-layer" onClick={onClose}>
      <aside
        className="order-drawer"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="drawer-heading">
          <div>
            <span className="eyebrow">Rider profile</span>
            <h2>
              {displayProfileValue(rider.profile?.full_name, "Unnamed rider")}
            </h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close rider details"
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        <div className="drawer-customer">
          <Avatar rider={rider} large />
          <div>
            <strong>
              {displayProfileValue(rider.profile?.full_name, "Unnamed rider")}
            </strong>
            <span>
              {displayProfileValue(
                rider.profile?.email,
                displayProfileValue(rider.profile?.phone, "No contact details"),
              )}
            </span>
          </div>
        </div>
        {error && <p className="login-message">{error}</p>}
        <div className="drawer-block">
          <h3>Approval</h3>
          <p className="drawer-line">
            <ApprovalStatusBadge value={rider.approval_status} />
            <RiderStatusBadge value={rider.rider_status} />
          </p>
        </div>
        <div className="drawer-block">
          <h3>Vehicle</h3>
          <p className="drawer-line">
            <Bike />
            {rider.vehicle_type ?? "Not available"} Â·{" "}
            {rider.vehicle_number ?? "No registration"}
          </p>
        </div>
        <div className="drawer-block">
          <h3>Performance</h3>
          <div className="profile-favorite-grid">
            <div>
              <small>Total deliveries</small>
              <strong>{rider.total_deliveries ?? 0}</strong>
            </div>
            <div>
              <small>Total earnings</small>
              <strong>{money(rider.total_earnings)}</strong>
            </div>
            <div>
              <small>Average rating</small>
              <strong>
                <Star /> {rider.rating ?? "N/A"}
              </strong>
            </div>
            <div>
              <small>Assigned now</small>
              <strong>{active.length}</strong>
            </div>
            <div>
              <small>Completed orders</small>
              <strong>{completed.length}</strong>
            </div>
            <div>
              <small>Cancelled / failed</small>
              <strong>{cancelled.length + failed.length}</strong>
            </div>
          </div>
        </div>
        <div className="drawer-block">
          <h3>Availability</h3>
          <p className="drawer-line">
            <OnlineStatusBadge online={rider.is_online} />
          </p>
          <p className="drawer-note">
            Latitude: {rider.current_latitude ?? "Not available"} Â· Longitude:{" "}
            {rider.current_longitude ?? "Not available"}
          </p>
        </div>
        <div className="drawer-block">
          <h3>Account</h3>
          <p className="drawer-note">
            Created {date(rider.created_at)}
            <br />
            Updated {date(rider.updated_at)}
          </p>
        </div>
        <div className="drawer-block">
          <h3>Delivery history</h3>
          {orders.length ? (
            orders.slice(0, 8).map((order) => (
              <div className="profile-order-row" key={order.id}>
                <span>
                  <strong>#{order.order_number}</strong>
                  <small>
                    {order.customer?.full_name ?? "Unknown customer"} Â·{" "}
                    {date(order.delivered_at ?? order.created_at)}
                  </small>
                </span>
                <strong>{money(order.total)}</strong>
                <span className="status-badge status-neutral">
                  <span />
                  {orderStatusLabels[order.status] ?? label(order.status)}
                </span>
              </div>
            ))
          ) : (
            <p className="drawer-note">No delivery history yet.</p>
          )}
          {completed.length > 0 && (
            <p className="drawer-note">
              {completed.length} completed order
              {completed.length === 1 ? "" : "s"}.
            </p>
          )}
        </div>
        <button className="secondary-button" onClick={onClose}>
          <ArrowLeft /> Back to riders
        </button>
      </aside>
    </div>
  );
}

export function AssignRiderModal({
  orderId,
  currentRiderId,
  order,
  onClose,
  onAssigned,
}: {
  orderId: string;
  currentRiderId?: string | null;
  order?: RiderAssignmentOrder;
  onClose: () => void;
  onAssigned: (message: string) => Promise<void>;
}) {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [selected, setSelected] = useState(currentRiderId ?? "");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [availability, setAvailability] = useState("all");
  const [online, setOnline] = useState("all");
  const [vehicle, setVehicle] = useState("all");
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    getAvailableRiders()
      .then(setRiders)
      .catch((reason: unknown) =>
        setError(errorMessage(reason, "Unable to load eligible riders.")),
      )
      .finally(() => setLoading(false));
  }, []);
  async function save() {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      await assignRider(orderId, selected);
      await onAssigned(
        currentRiderId
          ? "Rider reassigned successfully."
          : "Rider assigned successfully.",
      );
      onClose();
    } catch (reason) {
      setError(errorMessage(reason, "Unable to assign rider."));
    } finally {
      setBusy(false);
    }
  }
  const visibleRiders = riders.filter((rider) => {
    const searchText = [
      rider.profile?.full_name,
      rider.profile?.phone,
      rider.profile?.email,
      rider.vehicle_number,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const activeDeliveries = rider.active_delivery_count ?? 0;
    return (
      (!query.trim() || searchText.includes(query.trim().toLowerCase())) &&
      (availability === "all" ||
        (availability === "available"
          ? activeDeliveries === 0
          : activeDeliveries > 0)) &&
      (online === "all" ||
        (online === "online" ? rider.is_online : !rider.is_online)) &&
      (vehicle === "all" || rider.vehicle_type === vehicle)
    );
  });
  const vehicleTypes = Array.from(
    new Set(
      riders
        .map((rider) => rider.vehicle_type)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const selectedRider = riders.find((rider) => rider.id === selected);
  return (
    <div className="modal-layer" onClick={onClose}>
      <div
        className="assign-modal"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="drawer-heading">
          <div>
            <span className="eyebrow">Dispatch</span>
            <h2>{currentRiderId ? "Change rider" : "Assign rider"}</h2>
          </div>
          <button className="icon-button" aria-label="Close" onClick={onClose}>
            <X />
          </button>
        </div>
        {order && (
          <div className="assignment-order-summary">
            <strong>Order #{order.order_number}</strong>
            <span>
              {order.customer?.full_name ?? "Unknown customer"} ·{" "}
              {order.customer?.phone ?? "No phone"}
            </span>
            <span>
              {order.delivery_address ?? "No delivery address"} ·{" "}
              {money(order.total)}
            </span>
          </div>
        )}
        {!confirming && (
          <p className="modal-copy">
            Approved, active riders are ranked with online riders first. Busy
            riders are shown so workload is visible.
          </p>
        )}
        {confirming && selectedRider && (
          <div className="assignment-confirmation">
            <h3>
              Assign this order to{" "}
              {selectedRider.profile?.full_name ?? "this rider"}?
            </h3>
            <p>Order #{order?.order_number ?? orderId}</p>
            <p>{order?.delivery_address ?? "Delivery address unavailable"}</p>
            <p>
              {selectedRider.vehicle_type ?? "Vehicle unavailable"} -{" "}
              {selectedRider.vehicle_number ?? "No vehicle number"}
            </p>
          </div>
        )}
        {!confirming && (
          <div className="assignment-toolbar">
            <div className="riders-search">
              <Search />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search riders..."
                aria-label="Search riders"
              />
            </div>
            <select
              value={online}
              onChange={(event) => setOnline(event.target.value)}
            >
              <option value="all">All status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
            <select
              value={availability}
              onChange={(event) => setAvailability(event.target.value)}
            >
              <option value="all">All availability</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
            </select>
            <select
              value={vehicle}
              onChange={(event) => setVehicle(event.target.value)}
            >
              <option value="all">All vehicles</option>
              {vehicleTypes.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        )}
        {loading ? (
          <p>Loading riders...</p>
        ) : visibleRiders.length ? (
          <div className="assign-rider-list">
            {visibleRiders.map((rider) => (
              <label
                className={`assign-rider-option ${selected === rider.id ? "assign-rider-selected" : ""}`}
                key={rider.id}
              >
                <input
                  type="radio"
                  name="rider"
                  checked={selected === rider.id}
                  onChange={() => setSelected(rider.id)}
                />
                <Avatar rider={rider} />
                <span>
                  <strong>
                    {rider.profile?.full_name?.trim() || "Unnamed rider"}
                  </strong>
                  <small>
                    {rider.vehicle_type ?? "Vehicle not provided"} Â·{" "}
                    {rider.rating ?? "N/A"} rating Â·{" "}
                    {rider.active_delivery_count
                      ? `${rider.active_delivery_count} active`
                      : "Available"}
                  </small>
                </span>
                <OnlineStatusBadge online={rider.is_online} />
              </label>
            ))}
          </div>
        ) : (
          <p className="empty-state">
            No Available Riders. There are currently no approved and active
            riders available for assignment.
          </p>
        )}
        {error && <p className="login-message">{error}</p>}
        <div className="confirm-modal-actions">
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary-button"
            disabled={!selected || busy}
            onClick={() => {
              if (confirming) void save();
              else setConfirming(true);
            }}
          >
            {busy
              ? "Assigning..."
              : confirming
                ? "Confirm Assignment"
                : currentRiderId
                  ? "Change Rider"
                  : "Assign Rider"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function RiderFormModal({
  rider,
  onClose,
  onSaved,
}: {
  rider?: Rider | null;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [values, setValues] = useState({
    full_name: rider?.profile?.full_name ?? "",
    email: rider?.profile?.email ?? "",
    phone: rider?.profile?.phone ?? "",
    password: "",
    vehicle_type: rider?.vehicle_type ?? "",
    vehicle_number: rider?.vehicle_number ?? "",
    rider_status: rider?.rider_status ?? "inactive",
    approval_status: rider?.approval_status ?? "pending",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const change = (key: keyof typeof values, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));
  async function save() {
    setBusy(true);
    setError("");
    try {
      if (rider) await updateRiderProfile(rider.id, values);
      else await createRider(values);
      await onSaved(
        rider ? "Rider updated successfully." : "Rider added successfully.",
      );
      onClose();
    } catch (reason) {
      setError(errorMessage(reason, "Unable to save rider."));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-layer" onClick={onClose}>
      <div
        className="assign-modal rider-form-modal"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="drawer-heading">
          <div>
            <span className="eyebrow">Rider management</span>
            <h2>{rider ? "Edit rider" : "Add rider"}</h2>
          </div>
          <button className="icon-button" aria-label="Close" onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="form-grid">
          <label>
            Full name
            <input
              value={values.full_name}
              onChange={(event) => change("full_name", event.target.value)}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={values.email}
              onChange={(event) => change("email", event.target.value)}
            />
          </label>
          <label>
            Phone number
            <input
              value={values.phone}
              onChange={(event) => change("phone", event.target.value)}
            />
          </label>
          {!rider && (
            <label>
              Password
              <input
                type="password"
                value={values.password}
                onChange={(event) => change("password", event.target.value)}
              />
            </label>
          )}
          <label>
            Vehicle type
            <input
              value={values.vehicle_type}
              onChange={(event) => change("vehicle_type", event.target.value)}
              placeholder="Use an existing database value"
            />
          </label>
          <label>
            Vehicle number
            <input
              value={values.vehicle_number}
              onChange={(event) => change("vehicle_number", event.target.value)}
            />
          </label>
          <label>
            Rider status
            <select
              value={values.rider_status}
              onChange={(event) => change("rider_status", event.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label>
            Approval status
            <select
              value={values.approval_status}
              onChange={(event) =>
                change("approval_status", event.target.value)
              }
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
        </div>
        {error && <p className="login-message">{error}</p>}
        <div className="confirm-modal-actions">
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary-button"
            disabled={
              busy ||
              !values.full_name ||
              !values.email ||
              (!rider && !values.password)
            }
            onClick={() => void save()}
          >
            {busy ? "Saving..." : rider ? "Save changes" : "Create rider"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function RidersPage() {
  const router = useRouter();
  const [riders, setRiders] = useState<Rider[]>([]);
  const [stats, setStats] = useState<RiderStatsData | null>(null);
  const [query, setQuery] = useState("");
  const [approval, setApproval] = useState("all");
  const [status, setStatus] = useState("all");
  const [online, setOnline] = useState("all");
  const [vehicle, setVehicle] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [formRider, setFormRider] = useState<Rider | null | undefined>(
    undefined,
  );
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<{
    rider: Rider;
    kind: "approve" | "reject" | "activate" | "deactivate";
  } | null>(null);
  async function load() {
    console.log("[riders page] load: started");
    setLoading(true);
    setError("");
    try {
      const [nextRiders, nextStats] = await Promise.all([
        getRiders(),
        getRiderStats(),
      ]);
      console.log("[riders page] load: successful", {
        riderCount: nextRiders.length,
        riders: nextRiders,
        profiles: nextRiders.map((rider) => ({
          riderId: rider.id,
          profile: rider.profile,
        })),
        stats: nextStats,
      });
      setRiders(nextRiders);
      setStats(nextStats);
    } catch (reason) {
      console.error("[riders page] load: failed", reason);
      setError(errorMessage(reason, "Unable to load riders."));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    console.log("[riders page] mounted: loading riders");
    void load();
    const channel = supabase
      .channel("admin-riders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "riders" },
        (payload) => {
          console.log("[riders page] realtime update", payload);
          void load();
        },
      )
      .subscribe((status) =>
        console.log("[riders page] realtime subscription status", status),
      );
    return () => {
      console.log("[riders page] unmounted: removing realtime channel");
      void supabase.removeChannel(channel);
    };
  }, []);
  const vehicles = useMemo(
    () =>
      Array.from(
        new Set(
          riders
            .map((rider) => rider.vehicle_type)
            .filter((item): item is string => Boolean(item)),
        ),
      ).sort(),
    [riders],
  );
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const result = riders.filter((rider) => {
      const profile = rider.profile;
      const searchable = [
        profile?.full_name,
        profile?.phone,
        profile?.email,
        rider.vehicle_number,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        (!term || searchable.includes(term)) &&
        (approval === "all" || rider.approval_status === approval) &&
        (status === "all" || rider.rider_status === status) &&
        (online === "all" ||
          (online === "online" ? rider.is_online : !rider.is_online)) &&
        (vehicle === "all" || rider.vehicle_type === vehicle)
      );
    });
    console.log("[riders page] filtered riders", {
      total: riders.length,
      visible: result.length,
      filters: { query, approval, status, online, vehicle },
    });
    return result;
  }, [riders, query, approval, status, online, vehicle]);
  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  }
  async function update() {
    if (!confirm) return;
    const { rider, kind } = confirm;
    setBusy(true);
    try {
      if (kind === "approve" || kind === "reject")
        await updateRiderApprovalStatus(
          rider.id,
          kind === "approve" ? "approved" : "rejected",
        );
      else
        await updateRiderStatus(
          rider.id,
          kind === "activate" ? "active" : "inactive",
        );
      notify(
        `Rider ${kind === "approve" ? "approved" : kind === "reject" ? "rejected" : `${kind}d`} successfully.`,
      );
      setConfirm(null);
      await load();
    } catch (reason) {
      setError(errorMessage(reason, "Unable to update rider."));
    } finally {
      setBusy(false);
    }
  }
  return (
    <RiderShell>
      <main className="main-content riders-main">
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              <span className="live-dot" /> Management / Riders
            </div>
            <h1>Riders</h1>
            <p>
              Manage delivery riders, availability and delivery performance.
            </p>
          </div>
          <div className="heading-actions">
            <button
              className="secondary-button"
              onClick={() => router.push("/riders/map")}
            >
              <Map /> Live map
            </button>
          </div>
        </div>
        <RiderStats stats={stats} loading={loading} />
        {error && (
          <div className="login-message" role="alert">
            {error}
          </div>
        )}
        <section className="panel rider-table-panel">
          <div className="rider-toolbar">
            <div className="riders-search">
              <Search />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search riders..."
                aria-label="Search riders"
              />
            </div>
            <div className="rider-filters">
              <select
                value={approval}
                onChange={(event) => setApproval(event.target.value)}
                aria-label="Approval status"
              >
                <option value="all">All approval</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                aria-label="Rider status"
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={online}
                onChange={(event) => setOnline(event.target.value)}
                aria-label="Online status"
              >
                <option value="all">All online status</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
              <select
                value={vehicle}
                onChange={(event) => setVehicle(event.target.value)}
                aria-label="Vehicle type"
              >
                <option value="all">All vehicles</option>
                {vehicles.map((item) => (
                  <option key={item} value={item}>
                    {label(item)}
                  </option>
                ))}
              </select>
              <Filter />
            </div>
          </div>
          {loading ? (
            <div className="auth-checking">
              <p>Loading riders...</p>
            </div>
          ) : (
            <div className="rider-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Rider</th>
                    <th>Phone / email</th>
                    <th>Approval</th>
                    <th>Status</th>
                    <th>Online</th>
                    <th>Vehicle</th>
                    <th>Rating</th>
                    <th>Deliveries</th>
                    <th>Earnings</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((rider) => (
                    <tr key={rider.id}>
                      <td>
                        <button
                          className="rider-name-link"
                          onClick={() => setSelected(rider.id)}
                        >
                          <Avatar rider={rider} />
                          <span>
                            <strong>
                              {rider.profile?.full_name ?? "Unnamed rider"}
                            </strong>
                          </span>
                        </button>
                      </td>
                      <td>
                        <span>{rider.profile?.phone ?? "No phone"}</span>
                        <small>{rider.profile?.email ?? "No email"}</small>
                      </td>
                      <td>
                        <ApprovalStatusBadge value={rider.approval_status} />
                      </td>
                      <td>
                        <RiderStatusBadge value={rider.rider_status} />
                      </td>
                      <td>
                        <OnlineStatusBadge online={rider.is_online} />
                      </td>
                      <td>
                        {rider.vehicle_type ?? "Not provided"}
                        <small>{rider.vehicle_number ?? ""}</small>
                      </td>
                      <td>
                        <span className="rider-rating">
                          <Star /> {rider.rating ?? "N/A"}
                        </span>
                      </td>
                      <td>{rider.total_deliveries ?? 0}</td>
                      <td>{money(rider.total_earnings)}</td>
                      <td>
                        <button
                          className="icon-button"
                          aria-label={`Actions for ${rider.profile?.full_name ?? "rider"}`}
                          onClick={() => setSelected(rider.id)}
                        >
                          <MoreHorizontal />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filtered.length && (
                <div className="empty-riders">
                  <Search />
                  <strong>
                    {riders.length
                      ? "No riders match your filters."
                      : "No riders found."}
                  </strong>
                  <span>Try changing your search or filters.</span>
                </div>
              )}
              <div className="panel-footer">
                <span>
                  Showing {filtered.length} of {riders.length} riders
                </span>
              </div>
            </div>
          )}
        </section>
        {selected && (
          <RiderActionMenu
            rider={riders.find((rider) => rider.id === selected) ?? null}
            onClose={() => setSelected(null)}
            onDetails={() => router.push(`/riders/${selected}`)}
            onAction={(kind) => {
              setSelected(null);
              const rider = riders.find((item) => item.id === selected);
              if (rider) setConfirm({ rider, kind });
            }}
          />
        )}
        {confirm && (
          <ConfirmDialog
            action={{
              title: `${label(confirm.kind)} this rider?`,
              message: `Are you sure you want to ${confirm.kind} ${confirm.rider.profile?.full_name ?? "this rider"}?`,
              label: "Confirm",
            }}
            busy={busy}
            onCancel={() => setConfirm(null)}
            onConfirm={() => void update()}
          />
        )}
        {toast && (
          <div className="toast-message">
            <Check />
            {toast}
          </div>
        )}
      </main>
    </RiderShell>
  );
}

function RiderActionMenu({
  rider,
  onClose,
  onDetails,
  onAction,
}: {
  rider: Rider | null;
  onClose: () => void;
  onDetails: () => void;
  onAction: (kind: "approve" | "reject" | "activate" | "deactivate") => void;
}) {
  if (!rider) return null;
  return (
    <div className="modal-layer" onClick={onClose}>
      <div
        className="assign-modal rider-quick-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="drawer-heading">
          <div>
            <span className="eyebrow">Rider actions</span>
            <h2>{rider.profile?.full_name ?? "Unnamed rider"}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>
        <button className="primary-button" onClick={onDetails}>
          <Eye /> View details
        </button>
        {rider.approval_status === "pending" && (
          <>
            <button
              className="secondary-button rider-modal-button"
              onClick={() => onAction("approve")}
            >
              <Check /> Approve
            </button>
            <button
              className="secondary-button rider-modal-button"
              onClick={() => onAction("reject")}
            >
              <X /> Reject
            </button>
          </>
        )}
        {rider.approval_status === "approved" && (
          <button
            className="secondary-button rider-modal-button"
            onClick={() =>
              onAction(
                rider.rider_status === "active" ? "deactivate" : "activate",
              )
            }
          >
            <ShieldCheck />{" "}
            {rider.rider_status === "active" ? "Deactivate" : "Activate"}
          </button>
        )}
        <button
          className="secondary-button rider-modal-button"
          onClick={onClose}
        >
          <Phone /> {rider.profile?.phone ?? "No phone number"}
        </button>
      </div>
    </div>
  );
}

function RiderShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <ShamsiyaDashboard>
      <button
        className="primary-button"
        style={{ position: "fixed", top: 78, right: 24, zIndex: 10 }}
        onClick={() => router.push("/riders/new")}
      >
        <Plus /> Add rider
      </button>
      {children}
    </ShamsiyaDashboard>
  );
}
export function RiderProfile({ id }: { id: string }) {
  return (
    <RiderShell>
      <RiderDetailsDrawer
        riderId={id}
        onClose={() => history.back()}
        onChanged={async () => {}}
      />
    </RiderShell>
  );
}
export function RidersMapPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  useEffect(() => {
    void getRiders().then(setRiders);
  }, []);
  return (
    <RiderShell>
      <main className="main-content riders-map-main">
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              <span className="live-dot" /> Dispatch / Live operations
            </div>
            <h1>Rider availability</h1>
            <p>Monitor online status and current rider locations.</p>
          </div>
        </div>
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Live rider locations</h2>
              <p>Location is shown when the rider app provides coordinates.</p>
            </div>
          </div>
          <div className="rider-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Rider</th>
                  <th>Availability</th>
                  <th>Vehicle</th>
                  <th>Current location</th>
                </tr>
              </thead>
              <tbody>
                {riders.map((rider) => (
                  <tr key={rider.id}>
                    <td>
                      <div className="customer-cell">
                        <Avatar rider={rider} />
                        <strong>
                          {rider.profile?.full_name ?? "Unnamed rider"}
                        </strong>
                      </div>
                    </td>
                    <td>
                      <OnlineStatusBadge online={rider.is_online} />
                    </td>
                    <td>{rider.vehicle_type ?? "Not available"}</td>
                    <td>
                      {rider.current_latitude != null &&
                      rider.current_longitude != null
                        ? `${rider.current_latitude}, ${rider.current_longitude}`
                        : "Location unavailable"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </RiderShell>
  );
}

export default RidersPage;
