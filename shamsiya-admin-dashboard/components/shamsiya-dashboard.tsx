"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bike,
  Boxes,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Download,
  FilePlus2,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  PackageCheck,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Tag,
  TrendingUp,
  UserRound,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getCurrentAdmin, signOutAdmin } from "@/lib/supabase/auth";
import { getDashboardData } from "@/lib/services/dashboard";

const navGroups = [
  {
    label: "Main",
    items: [
      ["Dashboard", LayoutDashboard],
      ["Orders", ClipboardList],
      ["Foods", ShoppingBag],
      ["Categories", Boxes],
    ],
  },
  {
    label: "Management",
    items: [
      ["Customers", Users],
      ["Riders", Bike],
      ["Promotions", Tag],
      ["Reviews", Star],
    ],
  },
  {
    label: "AI & Intelligence",
    items: [
      ["AI Assistant", Sparkles],
      ["Recommendations", Zap],
      ["Image Recognition", Store],
    ],
  },
  {
    label: "Analytics",
    items: [
      ["Analytics", BarChart3],
      ["Payments", CreditCard],
    ],
  },
  {
    label: "System",
    items: [
      ["Notifications", Bell],
      ["Settings", Settings],
    ],
  },
] as const;
const revenueSets = {
  "7 days": [
    { day: "Mon", revenue: 4200, orders: 108 },
    { day: "Tue", revenue: 5800, orders: 132 },
    { day: "Wed", revenue: 5100, orders: 124 },
    { day: "Thu", revenue: 6900, orders: 156 },
    { day: "Fri", revenue: 7600, orders: 188 },
    { day: "Sat", revenue: 8900, orders: 220 },
    { day: "Sun", revenue: 9750, orders: 240 },
  ],
  "30 days": [
    { day: "Week 1", revenue: 18200, orders: 420 },
    { day: "Week 2", revenue: 22400, orders: 505 },
    { day: "Week 3", revenue: 26800, orders: 608 },
    { day: "Week 4", revenue: 31200, orders: 710 },
  ],
  "3 months": [
    { day: "Jun", revenue: 64800, orders: 1480 },
    { day: "Jul", revenue: 78200, orders: 1890 },
    { day: "Aug", revenue: 94250, orders: 2240 },
  ],
  "12 months": [
    { day: "Sep", revenue: 48200, orders: 1100 },
    { day: "Oct", revenue: 53600, orders: 1260 },
    { day: "Nov", revenue: 60200, orders: 1410 },
    { day: "Dec", revenue: 71800, orders: 1620 },
    { day: "Jan", revenue: 68400, orders: 1550 },
    { day: "Feb", revenue: 75400, orders: 1720 },
    { day: "Mar", revenue: 80200, orders: 1840 },
    { day: "Apr", revenue: 84600, orders: 1940 },
    { day: "May", revenue: 89200, orders: 2100 },
    { day: "Jun", revenue: 93600, orders: 2200 },
    { day: "Jul", revenue: 101400, orders: 2390 },
    { day: "Aug", revenue: 112500, orders: 2620 },
  ],
};
const statusData = [
  { name: "Delivered", value: 720, color: "#633e2d" },
  { name: "Out for Delivery", value: 198, color: "#d4883e" },
  { name: "Preparing", value: 142, color: "#bd9a70" },
  { name: "Pending", value: 86, color: "#e4c9aa" },
  { name: "Ready", value: 76, color: "#8d6a55" },
  { name: "Cancelled", value: 26, color: "#c7b9ae" },
];
const foods = [
  ["Mandi Chicken", "Rice dishes", "238", "₵21,420", "4.9", "🍗"],
  ["Jollof Rice", "Rice dishes", "214", "₵16,050", "4.8", "🍚"],
  ["Suya Pepper", "Grills", "186", "₵13,950", "4.9", "🥩"],
  ["Chicken Fried Rice", "Rice dishes", "164", "₵11,480", "4.7", "🍱"],
  ["Waakye Special", "Local favorites", "148", "₵9,620", "4.8", "🥘"],
] as const;
const orders = [
  [
    "#SH-10245",
    "Ama Boateng",
    "Mandi Chicken",
    "₵85.00",
    "Paid",
    "Preparing",
    "Ibrahim",
    "10:24 AM",
  ],
  [
    "#SH-10244",
    "Kojo Mensah",
    "Jollof Rice, Suya",
    "₵112.00",
    "Paid",
    "Out for Delivery",
    "Kwame",
    "10:18 AM",
  ],
  [
    "#SH-10243",
    "Nana Owusu",
    "Chicken Fried Rice",
    "₵74.50",
    "Paid",
    "Delivered",
    "Daniel",
    "9:56 AM",
  ],
  [
    "#SH-10242",
    "Efua Addo",
    "Waakye Special",
    "₵62.00",
    "Paid",
    "Pending",
    "Unassigned",
    "9:42 AM",
  ],
  [
    "#SH-10241",
    "Yaw Asare",
    "Mandi Chicken",
    "₵95.00",
    "Paid",
    "Delivered",
    "Ibrahim",
    "9:31 AM",
  ],
] as const;
const activities = [
  ["New order #SH-10245 received", "Just now", ClipboardList],
  ["Rider Ibrahim accepted delivery #SH-10241", "4 min ago", Bike],
  ["Payment received for #SH-10238", "12 min ago", CircleDollarSign],
  ["New customer registered", "26 min ago", UserRound],
  ["New review received", "38 min ago", Star],
] as const;

function statusClass(value: string) {
  return value === "Delivered"
    ? "status-success"
    : value === "Pending"
      ? "status-pending"
      : value === "Out for Delivery"
        ? "status-info"
        : "status-neutral";
}
function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <span>S</span>
      <i />
    </div>
  );
}
function Sidebar({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const active = pathname.startsWith("/orders")
    ? "Orders"
    : pathname.startsWith("/foods")
      ? "Foods"
      : pathname.startsWith("/categories")
        ? "Categories"
        : pathname.startsWith("/customers")
          ? "Customers"
          : pathname.startsWith("/riders")
            ? "Riders"
            : pathname.startsWith("/promotions")
              ? "Promotions"
              : pathname.startsWith("/reviews")
                ? "Reviews"
                : pathname.startsWith("/ai/assistant")
                  ? "AI Assistant"
                  : pathname.startsWith("/ai/recommendations")
                    ? "Recommendations"
                    : pathname.startsWith("/ai/image-recognition")
                      ? "Image Recognition"
                      : pathname.startsWith("/analytics")
                        ? "Analytics"
                        : pathname.startsWith("/payments")
                          ? "Payments"
                          : pathname.startsWith("/notifications")
                            ? "Notifications"
                            : pathname.startsWith("/settings")
                              ? "Settings"
                              : "Dashboard";
  const handleLogout = async () => {
    await signOutAdmin();
    document.cookie = "shamsiya_session=; path=/; max-age=0; SameSite=Lax";
    router.push("/login");
    router.refresh();
  };
  return (
    <>
      {open && (
        <button
          className="drawer-backdrop"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <div className="brand">
            <BrandMark />
            <div>
              <strong>Shamsiya</strong>
              <span>Special Food</span>
            </div>
          </div>
          <button
            className="mobile-close icon-button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X />
          </button>
        </div>
        <div className="dashboard-label">ADMIN DASHBOARD</div>
        <nav className="nav-list" aria-label="Primary navigation">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <div className="nav-group-label">{group.label}</div>
              {group.items.map(([label, Icon]) => (
                <button
                  aria-current={active === label ? "page" : undefined}
                  className={`nav-item ${active === label ? "nav-active" : ""}`}
                  key={label}
                  onClick={() => {
                    if (label === "Dashboard") router.push("/dashboard");
                    if (label === "Orders") router.push("/orders");
                    if (label === "Foods") router.push("/foods");
                    if (label === "Categories") router.push("/categories");
                    if (label === "Customers") router.push("/customers");
                    if (label === "Riders") router.push("/riders");
                    if (label === "Promotions") router.push("/promotions");
                    if (label === "Reviews") router.push("/reviews");
                    if (label === "AI Assistant") router.push("/ai/assistant");
                    if (label === "Recommendations")
                      router.push("/ai/recommendations");
                    if (label === "Image Recognition")
                      router.push("/ai/image-recognition");
                    if (label === "Analytics") router.push("/analytics");
                    if (label === "Payments") router.push("/payments");
                    if (label === "Notifications")
                      router.push("/notifications");
                    if (label === "Settings") router.push("/settings");
                    setOpen(false);
                  }}
                >
                  <Icon />
                  <span>{label}</span>
                  {label === "Notifications" && <b>4</b>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="profile-row">
            <div className="avatar avatar-lg">KA</div>
            <div className="profile-copy">
              <strong>Kofi Asante</strong>
              <span>Administrator</span>
            </div>
            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              <LogOut />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
function Topbar({ setOpen }: { setOpen: (v: boolean) => void }) {
  const [search, setSearch] = useState(false);
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="mobile-menu icon-button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
        >
          <Menu />
        </button>
        <div className="breadcrumbs">
          <span>Home</span>
          <ChevronRight />
          <strong>Dashboard</strong>
        </div>
      </div>
      <div className="topbar-actions">
        <button
          className="search-trigger"
          onClick={() => setSearch(true)}
          aria-label="Search orders, customers, foods"
        >
          <Search />
          <span>Search orders, customers, foods...</span>
        </button>
        <button
          className="icon-button notification-button"
          aria-label="Notifications"
        >
          <Bell />
          <i />
        </button>
        <div className="top-profile">
          <div className="avatar">KA</div>
          <span>Kofi Asante</span>
          <ChevronDown />
        </div>
      </div>
      {search && (
        <div className="modal-layer" onClick={() => setSearch(false)}>
          <div className="search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="search-modal-input">
              <Search />
              <input
                autoFocus
                placeholder="Search orders, customers, foods..."
              />
              <button
                className="icon-button"
                onClick={() => setSearch(false)}
                aria-label="Close search"
              >
                <X />
              </button>
            </div>
            <div className="search-results">
              <p>QUICK SEARCH</p>
              <button>
                <ClipboardList />
                <span>
                  <strong>Orders</strong>
                  <small>12 active orders</small>
                </span>
                <ChevronRight />
              </button>
              <button>
                <Users />
                <span>
                  <strong>Customers</strong>
                  <small>3,842 registered customers</small>
                </span>
                <ChevronRight />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
function StatCard({
  title,
  value,
  change,
  note,
  icon: Icon,
  positive = true,
}: {
  title: string;
  value: string;
  change: string;
  note: string;
  icon: typeof TrendingUp;
  positive?: boolean;
}) {
  return (
    <article className="stat-card overview-stat">
      <div className="stat-head">
        <span>{title}</span>
        <div className="stat-icon">
          <Icon />
        </div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-foot">
        <span className={positive ? "trend-up" : "trend-down"}>
          {positive ? <ArrowUpRight /> : <ArrowDownRight />}
          {change}
        </span>
        <span>{note}</span>
      </div>
    </article>
  );
}
function RevenueChart() {
  const [period, setPeriod] = useState<keyof typeof revenueSets>("7 days");
  const data = revenueSets[period];
  return (
    <section className="panel revenue-overview">
      <div className="panel-header">
        <div>
          <h2>Revenue Overview</h2>
          <p>Revenue and orders performance</p>
        </div>
        <div className="chart-pills">
          {Object.keys(revenueSets).map((item) => (
            <button
              key={item}
              className={period === item ? "pill-active" : ""}
              onClick={() => setPeriod(item as keyof typeof revenueSets)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-legend">
        <span>
          <i className="legend-revenue" />
          Revenue
        </span>
        <span>
          <i className="legend-orders" />
          Orders
        </span>
      </div>
      <div className="recharts-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 12, right: 14, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d4883e" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#d4883e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 4"
              vertical={false}
              stroke="#eee8e1"
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#aa9c91", fontSize: 10 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#aa9c91", fontSize: 10 }}
              tickFormatter={(v) => `₵${v / 1000}k`}
            />
            <Tooltip
              formatter={(value, name) => [
                name === "revenue"
                  ? `₵${Number(value).toLocaleString()}`
                  : value,
                name === "revenue" ? "Revenue" : "Orders",
              ]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e9e2d9",
                fontSize: 11,
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#c57831"
              strokeWidth={3}
              fill="url(#revenueFill)"
            />
            <Area
              type="monotone"
              dataKey="orders"
              stroke="#633e2d"
              strokeWidth={2}
              fill="none"
              yAxisId="orders"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
function DashboardContent() {
  const [dashboard, setDashboard] = useState<Awaited<
    ReturnType<typeof getDashboardData>
  > | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboardData()
      .then(setDashboard)
      .catch((error) =>
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load dashboard data.",
        ),
      );
  }, []);

  if (error)
    return (
      <main className="main-content">
        <div className="panel empty-state">
          <h2>Dashboard data unavailable</h2>
          <p>{error}</p>
        </div>
      </main>
    );
  if (!dashboard)
    return (
      <div className="auth-checking">
        <p>Loading dashboard data...</p>
      </div>
    );

  const orders = dashboard.orders;
  const value = (order: Record<string, unknown>, keys: string[]) =>
    keys
      .map((key) => order[key])
      .find((item) => item !== undefined && item !== null && item !== "");
  const orderRows = orders.slice(0, 5).map((order) => ({
    id: String(value(order, ["order_number", "order_id", "id"]) ?? "Order"),
    customer: String(
      value(order, ["customer_name", "customer", "name"]) ?? "Unknown customer",
    ),
    items: String(
      value(order, ["items", "item_name", "food_name"]) ?? "Order items",
    ),
    amount: Number(
      value(order, ["total_amount", "total", "amount", "grand_total"]) ?? 0,
    ),
    payment: String(value(order, ["payment_status", "payment"]) ?? "Unknown"),
    status: String(value(order, ["status", "order_status"]) ?? "Unknown"),
    rider: String(value(order, ["rider_name", "rider"]) ?? "Unassigned"),
    createdAt: String(value(order, ["created_at", "ordered_at", "date"]) ?? ""),
  }));
  const statusCounts = Array.from(
    new Set(
      orders.map((order) =>
        String(value(order, ["status", "order_status"]) ?? "Unknown"),
      ),
    ),
  ).map((name, index) => ({
    name,
    value: orders.filter(
      (order) =>
        String(value(order, ["status", "order_status"]) ?? "Unknown") === name,
    ).length,
    color: ["#633e2d", "#d4883e", "#bd9a70", "#8d6a55", "#c7b9ae"][index % 5],
  }));
  const revenue = orders.reduce(
    (total, order) =>
      total +
      Number(
        value(order, ["total_amount", "total", "amount", "grand_total"]) ?? 0,
      ),
    0,
  );
  const formatMoney = (amount: number) =>
    `GH₵${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const chartData = orders
    .slice(0, 7)
    .reverse()
    .map((order) => ({
      day: new Date(
        String(value(order, ["created_at", "ordered_at", "date"]) ?? ""),
      ).toLocaleDateString(undefined, { weekday: "short" }),
      revenue: Number(
        value(order, ["total_amount", "total", "amount", "grand_total"]) ?? 0,
      ),
      orders: 1,
    }));

  return (
    <main className="main-content overview-main">
      <div className="page-heading overview-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> Live workspace data
          </div>
          <h1>Good morning, Admin</h1>
          <p>Here&apos;s what&apos;s happening with Shamsiya Special Food.</p>
        </div>
      </div>
      <section className="stats-grid six-stats">
        <StatCard
          title="Revenue loaded"
          value={formatMoney(revenue)}
          change="Live"
          note="from loaded orders"
          icon={CircleDollarSign}
        />
        <StatCard
          title="Orders"
          value={String(dashboard.stats.orders)}
          change="Live"
          note="loaded from database"
          icon={ClipboardList}
        />
        <StatCard
          title="Customers"
          value={String(dashboard.stats.customers)}
          change="Live"
          note="active profiles"
          icon={Users}
        />
        <StatCard
          title="Riders"
          value={String(dashboard.stats.riders)}
          change="Live"
          note="rider profiles"
          icon={Bike}
        />
        <StatCard
          title="Pending orders"
          value={String(
            statusCounts.find((item) => item.name.toLowerCase() === "pending")
              ?.value ?? 0,
          )}
          change="Live"
          note="current status"
          icon={ClockIcon}
          positive={false}
        />
        <StatCard
          title="Completed"
          value={String(
            statusCounts.find((item) => item.name.toLowerCase() === "delivered")
              ?.value ?? 0,
          )}
          change="Live"
          note="delivered orders"
          icon={PackageCheck}
        />
      </section>
      <div className="overview-grid">
        <section className="panel revenue-overview">
          <div className="panel-header">
            <div>
              <h2>Revenue Overview</h2>
              <p>Based on loaded orders</p>
            </div>
          </div>
          <div className="recharts-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 4"
                  vertical={false}
                  stroke="#eee8e1"
                />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(chartValue, name) => [
                    name === "revenue"
                      ? formatMoney(Number(chartValue))
                      : chartValue,
                    name,
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#c57831"
                  fill="url(#revenueFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel status-panel">
          <div className="panel-header">
            <div>
              <h2>Order Status</h2>
              <p>Current distribution</p>
            </div>
          </div>
          {statusCounts.length ? (
            <>
              <div className="donut-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusCounts}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={69}
                      outerRadius={92}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {statusCounts.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center">
                  <strong>{orders.length}</strong>
                  <span>Loaded orders</span>
                </div>
              </div>
              <div className="status-legend">
                {statusCounts.map((item) => (
                  <div key={item.name}>
                    <span>
                      <i style={{ background: item.color }} />
                      {item.name}
                    </span>
                    <b>{item.value}</b>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="empty-state">No orders found.</p>
          )}
        </section>
      </div>
      <section className="panel orders-panel overview-orders">
        <div className="panel-header orders-header">
          <div>
            <h2>Recent Orders</h2>
            <p>Latest orders from the database</p>
          </div>
        </div>
        <div className="table-wrap">
          {orderRows.length ? (
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
                </tr>
              </thead>
              <tbody>
                {orderRows.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.id}</strong>
                    </td>
                    <td>{order.customer}</td>
                    <td>{order.items}</td>
                    <td>{formatMoney(order.amount)}</td>
                    <td>{order.payment}</td>
                    <td>
                      <span
                        className={`status-badge ${statusClass(order.status)}`}
                      >
                        <span />
                        {order.status}
                      </span>
                    </td>
                    <td>{order.rider}</td>
                    <td>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty-state">No orders found.</p>
          )}
        </div>
      </section>
      <footer className="page-footer">
        <span>Shamsiya Admin</span>
        <span>
          <span className="live-dot" /> Connected to live data
        </span>
      </footer>
    </main>
  );
}
function ClockIcon(props: object) {
  return <CalendarDays {...props} />;
}
export default function ShamsiyaDashboard({
  children,
}: {
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  useEffect(() => {
    async function checkAdmin() {
      const admin = await getCurrentAdmin();
      if (!admin) {
        router.replace("/login");
        return;
      }
      setCheckingAuth(false);
    }
    checkAdmin();
  }, [router]);
  if (checkingAuth)
    return (
      <div className="auth-checking">
        <p>Checking authentication...</p>
      </div>
    );
  return (
    <div className="dashboard-app">
      <Sidebar open={open} setOpen={setOpen} />
      <div className="app-canvas">
        <Topbar setOpen={setOpen} />
        {children || <DashboardContent />}
      </div>
    </div>
  );
}

export { DashboardContent, Sidebar, Topbar };
