"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  Clock3,
  CreditCard,
  Filter,
  MapPin,
  MoreHorizontal,
  PackageCheck,
  Search,
  Truck,
  X,
  AlertTriangle,
} from "lucide-react";
import ShamsiyaDashboard from "./shamsiya-dashboard";
import {
  assignRider,
  cancelOrder,
  getAvailableRiders,
  getOrders,
  updateOrderStatus,
  type OrderStatus,
} from "@/lib/services/orders";
import { supabase } from "@/lib/supabase/client";
import { AssignRiderModal } from "@/components/shamsiya-riders";

type OrderRow = {
  id: string;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  delivery_address: string | null;
  customer_note: string | null;
  rider_note: string | null;
  customer_phone: string | null;
  payment_method: string | null;
  payment_status: string;
  created_at: string;
  accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  customer?: {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
  } | null;
  rider?: {
    id: string;
    full_name: string | null;
    phone: string | null;
    profile?: {
      full_name: string | null;
      email: string | null;
      phone: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
  address?: {
    label: string | null;
    address: string;
    city: string | null;
    delivery_instructions: string | null;
  } | null;
  order_items?: {
    id: string;
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
};
type Rider = {
  id: string;
  vehicle_type: string | null;
  vehicle_number: string | null;
  is_online: boolean;
};

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
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
const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready_for_pickup",
  ready_for_pickup: "rider_assigned",
  rider_assigned: "rider_accepted",
  rider_accepted: "picked_up",
  picked_up: "out_for_delivery",
  out_for_delivery: "arrived",
  arrived: "delivered",
};
const paymentLabels: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  successful: "Successful",
  failed: "Failed",
  refunded: "Refunded",
};
const badgeClass = (status: string) =>
  ["delivered", "confirmed", "rider_accepted"].includes(status)
    ? "status-success"
    : ["pending", "cancelled", "failed"].includes(status)
      ? "status-pending"
      : status === "out_for_delivery"
        ? "status-info"
        : "status-neutral";
const money = (value: number) =>
  `GH₵${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`status-badge ${badgeClass(status)}`}>
      <span />
      {statusLabels[status]}
    </span>
  );
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  busy,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  if (!open) return null;
  return (
    <div className="modal-layer" role="presentation" onClick={onCancel}>
      <div
        className="confirm-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div className="confirm-modal-head">
          <AlertTriangle />
          <h3 id="confirm-title">{title}</h3>
        </div>
        <p className="modal-copy">{message}</p>
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
            {busy ? "Updating..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const timelineSteps: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready_for_pickup",
  "rider_assigned",
  "rider_accepted",
  "picked_up",
  "out_for_delivery",
  "arrived",
  "delivered",
];
function OrderTimeline({ order }: { order: OrderRow }) {
  const currentIndex = timelineSteps.indexOf(order.status);
  const timestampFor = (status: OrderStatus) =>
    status === "pending"
      ? order.created_at
      : status === "rider_accepted"
        ? order.accepted_at
        : status === "picked_up"
          ? order.picked_up_at
          : status === "delivered"
            ? order.delivered_at
            : undefined;
  return (
    <div className="order-timeline">
      {timelineSteps.map((status, index) => {
        const completed = currentIndex >= 0 && index < currentIndex;
        const current = index === currentIndex;
        const timestamp = timestampFor(status);
        return (
          <div
            className={`timeline-item ${completed ? "timeline-completed" : ""} ${current ? "timeline-current" : ""}`}
            key={status}
          >
            <span className="timeline-marker">
              {completed ? "✓" : current ? "●" : "○"}
            </span>
            <div>
              <strong>{statusLabels[status]}</strong>
              <small>
                {timestamp
                  ? new Date(timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : current
                    ? "Current status"
                    : "Upcoming"}
              </small>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrderStatusActions({
  order,
  onStatusChange,
  onCancel,
  busy,
}: {
  order: OrderRow;
  onStatusChange: (status: OrderStatus) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const status = order.status;
  if (status === "delivered")
    return (
      <div className="order-status-actions">
        <p className="drawer-note">Order completed successfully.</p>
      </div>
    );
  if (status === "cancelled")
    return (
      <div className="order-status-actions">
        <p className="drawer-note">Order was cancelled.</p>
      </div>
    );
  if (status === "failed")
    return (
      <div className="order-status-actions">
        <p className="drawer-note">Order failed.</p>
      </div>
    );

  const next = nextStatus[status];
  const actions: {
    key: string;
    label: string;
    status?: OrderStatus;
    variant?: "primary" | "secondary";
    icon?: typeof ChevronRight;
  }[] = [];

  if (status === "pending")
    actions.push({
      key: "confirm",
      label: "Confirm Order",
      status: "confirmed",
      variant: "primary",
      icon: Check,
    });
  if (status === "confirmed")
    actions.push({
      key: "prepare",
      label: "Start Preparing",
      status: "preparing",
      variant: "primary",
      icon: ChevronRight,
    });
  if (status === "preparing")
    actions.push({
      key: "ready",
      label: "Mark Ready for Pickup",
      status: "ready_for_pickup",
      variant: "primary",
      icon: Check,
    });
  if (status === "ready_for_pickup")
    actions.push({
      key: "assign",
      label: "Assign Rider",
      variant: "secondary",
    });
  if (status === "rider_assigned")
    actions.push({
      key: "change-rider",
      label: "Change Rider",
      variant: "secondary",
    });
  if (status === "arrived")
    actions.push({
      key: "deliver",
      label: "Mark Delivered",
      status: "delivered",
      variant: "primary",
      icon: Check,
    });

  if (
    ["pending", "confirmed", "preparing", "ready_for_pickup"].includes(status)
  )
    actions.push({
      key: "cancel",
      label: "Cancel Order",
      variant: "secondary",
    });
  if (
    [
      "pending",
      "confirmed",
      "preparing",
      "ready_for_pickup",
      "rider_assigned",
      "rider_accepted",
      "picked_up",
      "out_for_delivery",
      "arrived",
    ].includes(status)
  )
    actions.push({
      key: "fail",
      label: "Mark Failed",
      status: "failed",
      variant: "secondary",
    });

  return (
    <div className="order-status-actions">
      {(status === "rider_assigned" ||
        status === "rider_accepted" ||
        status === "picked_up") && (
        <p className="drawer-note">
          {status === "rider_assigned"
            ? "Waiting for rider acceptance."
            : status === "rider_accepted"
              ? "Rider has accepted the order."
              : "Rider has picked up the order."}
        </p>
      )}
      {actions.map((action) => {
        if (action.key === "assign" || action.key === "change-rider")
          return null;
        if (action.status && action.status === "failed")
          return (
            <button
              key={action.key}
              className="secondary-button"
              disabled={busy}
              onClick={() => void onStatusChange(action.status!)}
            >
              {busy ? "Updating..." : action.label}
            </button>
          );
        if (action.status)
          return (
            <button
              key={action.key}
              className={`${action.variant === "primary" ? "primary" : "secondary"}-button`}
              disabled={busy}
              onClick={() => void onStatusChange(action.status!)}
            >
              {action.icon && <action.icon />}
              {busy ? "Updating..." : action.label}
            </button>
          );
        return (
          <button
            key={action.key}
            className={`${action.variant === "primary" ? "primary" : "secondary"}-button`}
            disabled={busy}
          >
            {action.label}
          </button>
        );
      })}
    </div>
  );
}

function OrderDetails({
  order,
  riders,
  onClose,
  onChanged,
  onAssignRider,
}: {
  order: OrderRow;
  riders: Rider[];
  onClose: () => void;
  onChanged: () => Promise<void>;
  onAssignRider: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    action: () => Promise<void>;
  } | null>(null);
  const [selectedRider, setSelectedRider] = useState(order.rider?.id ?? "");
  const [selectedStatus, setSelectedStatus] = useState(order.status);
  const next = nextStatus[order.status];
  const statusOptions = [
    order.status,
    ...(next && !["rider_assigned", "rider_accepted"].includes(next)
      ? [next]
      : []),
    ...(["pending", "confirmed", "preparing", "ready_for_pickup"].includes(
      order.status,
    )
      ? ["cancelled" as const]
      : []),
    ...([
      "pending",
      "confirmed",
      "preparing",
      "ready_for_pickup",
      "rider_assigned",
      "rider_accepted",
      "picked_up",
      "out_for_delivery",
      "arrived",
    ].includes(order.status)
      ? ["failed" as const]
      : []),
  ];

  function notify(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  }

  async function changeStatus(status: OrderStatus) {
    if (status === "cancelled") {
      const reason = prompt("Please provide a cancellation reason:");
      if (!reason) return;
      setBusy(true);
      setError("");
      try {
        await cancelOrder(order.id, reason);
        notify("Order cancelled successfully.");
        await onChanged();
        onClose();
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Unable to cancel order.",
        );
      } finally {
        setBusy(false);
      }
      return;
    }
    setConfirm({
      title: `Update order to ${statusLabels[status]}?`,
      message: `Are you sure you want to update order #${order.order_number} to ${statusLabels[status]}?`,
      action: async () => {
        await updateOrderStatus(order.id, status);
        notify("Order status updated successfully.");
        await onChanged();
        onClose();
      },
    });
  }

  async function runConfirm() {
    if (!confirm) return;
    setBusy(true);
    setError("");
    try {
      await confirm.action();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to update order.",
      );
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }

  async function saveRider() {
    if (!selectedRider) return;
    setBusy(true);
    setError("");
    try {
      await assignRider(order.id, selectedRider);
      notify("Rider assigned successfully.");
      await onChanged();
      onClose();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to assign rider.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-layer" role="presentation" onClick={onClose}>
      <aside
        className="order-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="drawer-heading">
          <div>
            <span className="eyebrow">Order details</span>
            <h2 id="order-detail-title">#{order.order_number}</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close order details"
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        <div className="drawer-status">
          <StatusBadge status={order.status} />
          <span>{new Date(order.created_at).toLocaleString()}</span>
        </div>
        <div className="drawer-block">
          <h3>Order timeline</h3>
          <OrderTimeline order={order} />
        </div>
        <div className="drawer-block">
          <h3>Customer</h3>
          <div className="drawer-customer">
            <div className="avatar avatar-lg">
              {(order.customer?.full_name ?? "Customer")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <strong>{order.customer?.full_name ?? "Unknown customer"}</strong>
              <span>
                {order.customer_phone ??
                  order.customer?.phone ??
                  order.customer?.email ??
                  "No contact details"}
              </span>
            </div>
          </div>
        </div>
        <div className="drawer-block">
          <h3>Delivery address</h3>
          <p className="drawer-line">
            <MapPin />
            {order.address?.address ??
              order.delivery_address ??
              "No address provided"}
            {order.address?.city ? `, ${order.address.city}` : ""}
          </p>
          {order.address?.delivery_instructions && (
            <p className="drawer-note">
              Instructions: {order.address.delivery_instructions}
            </p>
          )}
        </div>
        <div className="drawer-block">
          <h3>Order items</h3>
          {(order.order_items ?? []).map((item) => (
            <div className="item-line" key={item.id}>
              <span>
                {item.name} ×{item.quantity} · {money(item.unit_price)} each
              </span>
              <strong>{money(item.total_price)}</strong>
            </div>
          ))}
          <div className="item-line">
            <span>Subtotal</span>
            <strong>{money(order.subtotal)}</strong>
          </div>
          {order.discount > 0 && (
            <div className="item-line">
              <span>Discount</span>
              <strong>-{money(order.discount)}</strong>
            </div>
          )}
          <div className="item-line">
            <span>Delivery</span>
            <strong>{money(order.delivery_fee)}</strong>
          </div>
          <div className="item-line total-line">
            <span>Total</span>
            <strong>{money(order.total)}</strong>
          </div>
        </div>
        {order.customer_note && (
          <div className="drawer-block">
            <h3>Customer note</h3>
            <p className="drawer-note">{order.customer_note}</p>
          </div>
        )}
        <div className="drawer-block">
          <h3>Payment</h3>
          <p className="drawer-line">
            <CreditCard />
            {order.payment_method ?? "Not specified"} ·{" "}
            {paymentLabels[order.payment_status] ?? order.payment_status}
          </p>
        </div>
        <div className="drawer-block">
          <h3>Rider</h3>
          <div className="drawer-line">
            <Truck />
            {order.rider?.profile?.full_name?.trim() ||
              order.rider?.full_name?.trim() ||
              "Not assigned"}
          </div>
          {order.rider_note && (
            <p className="drawer-note">Rider note: {order.rider_note}</p>
          )}
          {["ready_for_pickup", "rider_assigned"].includes(order.status) && (
            <button className="secondary-button" onClick={onAssignRider}>
              {order.status === "rider_assigned"
                ? "Change rider"
                : "Assign rider"}
            </button>
          )}
        </div>
        <div className="drawer-block order-status-control">
          <h3>Update order status</h3>
          <OrderStatusActions
            order={order}
            onStatusChange={changeStatus}
            onCancel={onClose}
            busy={busy}
          />
        </div>
        {error && (
          <p className="login-message" role="alert">
            {error}
          </p>
        )}
        {toast && (
          <p className="toast-message" role="status">
            <Check />
            {toast}
          </p>
        )}
        <ConfirmDialog
          open={!!confirm}
          title={confirm?.title ?? ""}
          message={confirm?.message ?? ""}
          confirmLabel="Confirm"
          onConfirm={runConfirm}
          onCancel={() => setConfirm(null)}
          busy={busy}
        />
      </aside>
    </div>
  );
}

export function OrdersContent() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All status");
  const [paymentStatus, setPaymentStatus] = useState("All payment");
  const [paymentMethod, setPaymentMethod] = useState("All methods");
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [assignment, setAssignment] = useState<{
    orderId: string;
    riderId: string | null;
    order: {
      id: string;
      order_number: string;
      status: string;
      total: number;
      delivery_address: string | null;
      customer?: { full_name: string | null; phone: string | null } | null;
    };
  } | null>(null);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load() {
    setLoading(true);
    setError("");
    try {
      const [orderData, riderData] = await Promise.all([
        getOrders(),
        getAvailableRiders(),
      ]);
      setOrders((orderData as OrderRow[]) ?? []);
      setRiders((riderData as Rider[]) ?? []);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load orders.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
    const channel = supabase
      .channel("admin-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          void load();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);
  const filtered = useMemo(() => {
    const searchText = query.trim().toLowerCase();
    return orders.filter(
      (order) =>
        (status === "All status" || statusLabels[order.status] === status) &&
        (paymentStatus === "All payment" ||
          paymentLabels[order.payment_status] === paymentStatus) &&
        (paymentMethod === "All methods" ||
          order.payment_method === paymentMethod) &&
        (!searchText ||
          [
            order.order_number,
            order.customer?.full_name,
            order.customer?.email,
            order.delivery_address,
            order.rider?.id,
            order.payment_method,
            order.payment_status,
            ...(order.order_items ?? []).map((item) => item.name),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(searchText)),
    );
  }, [orders, query, status, paymentStatus, paymentMethod]);
  const totalOrders = orders.length;
  const pending = orders.filter((order) => order.status === "pending").length;
  const preparing = orders.filter(
    (order) => order.status === "preparing",
  ).length;
  const outForDelivery = orders.filter(
    (order) => order.status === "out_for_delivery",
  ).length;
  const delivered = orders.filter(
    (order) => order.status === "delivered",
  ).length;
  const cancelled = orders.filter(
    (order) => order.status === "cancelled",
  ).length;
  const revenue = orders.reduce(
    (sum, order) => sum + Number(order.total ?? 0),
    0,
  );
  const paymentMethods = useMemo(
    () =>
      Array.from(
        new Set(
          orders
            .map((o) => o.payment_method)
            .filter((m): m is string => Boolean(m)),
        ),
      ).sort(),
    [orders],
  );
  return (
    <main className="main-content orders-main">
      <div className="page-heading overview-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> Live order data
          </div>
          <h1>Orders</h1>
          <p>Track, confirm, prepare, assign, and deliver every order.</p>
        </div>
      </div>
      {error && (
        <div className="login-message" role="alert">
          {error}
        </div>
      )}
      <section className="stats-grid order-stats">
        <article className="stat-card">
          <div className="stat-head">
            <span>Total orders</span>
            <div className="stat-icon">
              <PackageCheck />
            </div>
          </div>
          <div className="stat-value">{totalOrders}</div>
          <div className="stat-foot">
            <span>Live</span>
            <span>database orders</span>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-head">
            <span>Pending</span>
            <div className="stat-icon">
              <Clock3 />
            </div>
          </div>
          <div className="stat-value">{pending}</div>
          <div className="stat-foot">
            <span>Needs attention</span>
            <span>awaiting confirmation</span>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-head">
            <span>Preparing</span>
            <div className="stat-icon">
              <PackageCheck />
            </div>
          </div>
          <div className="stat-value">{preparing}</div>
          <div className="stat-foot">
            <span>In progress</span>
            <span>kitchen active</span>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-head">
            <span>Out for Delivery</span>
            <div className="stat-icon">
              <Truck />
            </div>
          </div>
          <div className="stat-value">{outForDelivery}</div>
          <div className="stat-foot">
            <span>Live</span>
            <span>on the route</span>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-head">
            <span>Delivered</span>
            <div className="stat-icon">
              <Check />
            </div>
          </div>
          <div className="stat-value">{delivered}</div>
          <div className="stat-foot">
            <span>Completed</span>
            <span>successful orders</span>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-head">
            <span>Cancelled</span>
            <div className="stat-icon">
              <X />
            </div>
          </div>
          <div className="stat-value">{cancelled}</div>
          <div className="stat-foot">
            <span>Cancelled</span>
            <span>no action needed</span>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-head">
            <span>Order revenue</span>
            <div className="stat-icon">
              <CreditCard />
            </div>
          </div>
          <div className="stat-value">{money(revenue)}</div>
          <div className="stat-foot">
            <span>Live</span>
            <span>loaded orders</span>
          </div>
        </article>
      </section>
      <section className="panel orders-table-panel">
        <div className="orders-toolbar">
          <div className="orders-search">
            <Search />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by order, customer, food, or rider..."
              aria-label="Search orders"
            />
          </div>
          <div className="orders-filters">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter by status"
            >
              <option>All status</option>
              {Object.values(statusLabels).map((label) => (
                <option key={label}>{label}</option>
              ))}
            </select>
            <select
              value={paymentStatus}
              onChange={(event) => setPaymentStatus(event.target.value)}
              aria-label="Filter by payment status"
            >
              <option>All payment</option>
              {Object.values(paymentLabels).map((label) => (
                <option key={label}>{label}</option>
              ))}
            </select>
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              aria-label="Filter by payment method"
            >
              <option>All methods</option>
              {paymentMethods.map((method) => (
                <option key={method}>{method}</option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
          <div className="auth-checking">
            <p>Loading orders...</p>
          </div>
        ) : (
          <div className="table-wrap orders-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Rider</th>
                  <th>Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <button
                        className="order-link"
                        onClick={() => setSelected(order)}
                      >
                        #{order.order_number}
                      </button>
                      <small>{order.delivery_address ?? "No address"}</small>
                    </td>
                    <td>
                      <div className="customer-cell">
                        <div className="avatar avatar-sm">
                          {(order.customer?.full_name ?? "C")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <strong>
                            {order.customer?.full_name ?? "Unknown customer"}
                          </strong>
                          <small>
                            {order.customer_phone ??
                              order.customer?.phone ??
                              order.customer?.email ??
                              "No contact"}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="order-items-cell">
                        {(order.order_items ?? []).map((item) => (
                          <span key={item.id}>
                            {item.name} ×{item.quantity}
                          </span>
                        ))}
                        {!order.order_items?.length && <span>No items</span>}
                      </div>
                    </td>
                    <td>
                      <strong>{money(order.total)}</strong>
                    </td>
                    <td>
                      <span
                        className={`payment-badge ${order.payment_status === "successful" ? "payment-paid" : "payment-pending"}`}
                      >
                        <span />
                        {order.payment_method ?? "Not specified"} ·{" "}
                        {paymentLabels[order.payment_status] ??
                          order.payment_status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${badgeClass(order.status)}`}
                      >
                        <span />
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td>
                      {order.rider?.profile?.full_name?.trim() ||
                        order.rider?.full_name?.trim() || (
                          <span className="assign-link">Not assigned</span>
                        )}
                    </td>
                    <td>
                      <small>
                        {new Date(order.created_at).toLocaleString()}
                      </small>
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        onClick={() => setSelected(order)}
                        aria-label={`View ${order.order_number}`}
                      >
                        <MoreHorizontal />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && (
              <div className="empty-orders">
                <Search />
                <strong>No orders found</strong>
                <span>
                  {query
                    ? "Try a different search."
                    : "No orders have been created yet."}
                </span>
              </div>
            )}
            <div className="panel-footer">
              <span>
                Showing {filtered.length} of {orders.length} orders
              </span>
            </div>
          </div>
        )}
      </section>
      {selected && (
        <OrderDetails
          order={selected}
          riders={riders}
          onClose={() => setSelected(null)}
          onChanged={load}
          onAssignRider={() =>
            setAssignment({
              orderId: selected.id,
              riderId: selected.rider?.id ?? null,
              order: {
                id: selected.id,
                order_number: selected.order_number,
                status: selected.status,
                total: selected.total,
                delivery_address: selected.delivery_address,
                customer: selected.customer
                  ? {
                      full_name: selected.customer.full_name,
                      phone: selected.customer.phone,
                    }
                  : null,
              },
            })
          }
        />
      )}
      {assignment && (
        <AssignRiderModal
          orderId={assignment.orderId}
          currentRiderId={assignment.riderId}
          order={assignment.order}
          onClose={() => setAssignment(null)}
          onAssigned={async (message) => {
            setToast(message);
            await load();
          }}
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

export default function ShamsiyaOrders() {
  return (
    <ShamsiyaDashboard>
      <OrdersContent />
    </ShamsiyaDashboard>
  );
}
