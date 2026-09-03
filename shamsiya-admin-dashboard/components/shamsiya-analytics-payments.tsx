"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bike,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Download,
  Filter,
  Image as ImageIcon,
  Info,
  MoreHorizontal,
  PackageCheck,
  Search,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  getPayments,
  type Payment,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/services/payments";

type AnalyticsRevenuePoint = { label: string; revenue: number; orders: number };
const revenueData: Record<string, AnalyticsRevenuePoint[]> = {
  "7 days": [
    { label: "Mon", revenue: 4200, orders: 108 },
    { label: "Tue", revenue: 5800, orders: 132 },
    { label: "Wed", revenue: 5100, orders: 124 },
    { label: "Thu", revenue: 6900, orders: 156 },
    { label: "Fri", revenue: 7600, orders: 188 },
    { label: "Sat", revenue: 8900, orders: 220 },
    { label: "Sun", revenue: 9750, orders: 240 },
  ],
  "30 days": [
    { label: "Week 1", revenue: 18200, orders: 420 },
    { label: "Week 2", revenue: 22400, orders: 505 },
    { label: "Week 3", revenue: 26800, orders: 608 },
    { label: "Week 4", revenue: 31200, orders: 710 },
  ],
  "3 months": [
    { label: "Jun", revenue: 64800, orders: 1480 },
    { label: "Jul", revenue: 78200, orders: 1890 },
    { label: "Aug", revenue: 94250, orders: 2240 },
  ],
};
const foodSales = [
  ["Mandi Chicken", 238, "₵21,420", 91],
  ["Jollof Rice", 214, "₵16,050", 78],
  ["Suya Pepper", 186, "₵13,950", 67],
  ["Chicken Fried Rice", 164, "₵11,480", 54],
  ["Waakye Special", 148, "₵9,620", 44],
] as const;
const riders = [
  ["Ibrahim K.", "1,284", "₵14,280", "4.9", "96%"],
  ["Kwame A.", "1,109", "₵12,840", "4.8", "94%"],
  ["Daniel O.", "982", "₵11,420", "4.9", "92%"],
  ["Mariam S.", "876", "₵9,860", "4.7", "89%"],
] as const;
const payments = [
  [
    "SH-10245",
    "Ama Boateng",
    "₵85.00",
    "Visa •••• 4242",
    "Paid",
    "Aug 19, 10:24 AM",
  ],
  [
    "SH-10244",
    "Kojo Mensah",
    "₵112.00",
    "Mobile Money",
    "Paid",
    "Aug 19, 10:18 AM",
  ],
  [
    "SH-10243",
    "Nana Owusu",
    "₵74.50",
    "Mastercard •••• 8831",
    "Refunded",
    "Aug 19, 9:56 AM",
  ],
  [
    "SH-10242",
    "Efua Addo",
    "₵62.00",
    "Mobile Money",
    "Pending",
    "Aug 19, 9:42 AM",
  ],
  [
    "SH-10241",
    "Yaw Asare",
    "₵95.00",
    "Visa •••• 1802",
    "Paid",
    "Aug 19, 9:31 AM",
  ],
  [
    "SH-10240",
    "Adwoa Mensah",
    "₵128.00",
    "Mobile Money",
    "Paid",
    "Aug 19, 9:14 AM",
  ],
] as const;
function Stat({
  title,
  value,
  change,
  icon: Icon,
  down = false,
}: {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  down?: boolean;
}) {
  return (
    <article className="stat-card analytics-stat">
      <div className="stat-head">
        <span>{title}</span>
        <div className="stat-icon">
          <Icon />
        </div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-foot">
        <span className={down ? "trend-down" : "trend-up"}>
          {down ? <ArrowDownRight /> : <ArrowUpRight />}
          {change}
        </span>
        <span>vs previous period</span>
      </div>
    </article>
  );
}
function AnalyticsPage() {
  const [range, setRange] = useState<keyof typeof revenueData>("7 days");
  const [metric, setMetric] = useState<"Revenue" | "Orders">("Revenue");
  const data = revenueData[range];
  return (
    <main className="main-content analytics-main">
      <div className="page-heading overview-heading">
        <div>
          <div className="eyebrow">
            <BarChart3 /> Business intelligence
          </div>
          <h1>Analytics</h1>
          <p>Understand your performance and make smarter decisions.</p>
        </div>
        <div className="heading-actions">
          <select
            value={range}
            onChange={(e) =>
              setRange(e.target.value as keyof typeof revenueData)
            }
            aria-label="Analytics date range"
          >
            <option>7 days</option>
            <option>30 days</option>
            <option>3 months</option>
          </select>
          <button className="secondary-button">
            <Download /> Export
          </button>
        </div>
      </div>
      <section className="stats-grid analytics-stats">
        <Stat
          title="Total Revenue"
          value="₵286,450"
          change="12.5%"
          icon={CircleDollarSign}
        />
        <Stat
          title="Total Orders"
          value="8,942"
          change="8.2%"
          icon={PackageCheck}
        />
        <Stat
          title="Avg. Order Value"
          value="₵32.03"
          change="4.8%"
          icon={Wallet}
        />
        <Stat title="New Customers" value="1,284" change="14.6%" icon={Users} />
        <Stat
          title="Completion Rate"
          value="88.4%"
          change="2.1%"
          icon={CheckCircle2}
        />
        <Stat
          title="Repeat Rate"
          value="64.8%"
          change="1.7%"
          icon={TrendingUp}
          down
        />
      </section>
      <div className="analytics-chart-grid">
        <section className="panel analytics-chart-panel">
          <div className="panel-header">
            <div>
              <h2>Revenue &amp; Orders</h2>
              <p>Track your business growth over time</p>
            </div>
            <div className="metric-pills">
              <button
                className={metric === "Revenue" ? "pill-active" : ""}
                onClick={() => setMetric("Revenue")}
              >
                Revenue
              </button>
              <button
                className={metric === "Orders" ? "pill-active" : ""}
                onClick={() => setMetric("Orders")}
              >
                Orders
              </button>
            </div>
          </div>
          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 18, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="analyticsFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#d4883e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#d4883e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 4"
                  vertical={false}
                  stroke="#eee8e1"
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#aa9c91", fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#aa9c91", fontSize: 10 }}
                  tickFormatter={(v) =>
                    metric === "Revenue" ? `₵${v / 1000}k` : `${v}`
                  }
                />
                <Tooltip
                  formatter={(value) =>
                    metric === "Revenue"
                      ? `₵${Number(value).toLocaleString()}`
                      : value
                  }
                />
                <Area
                  type="monotone"
                  dataKey={metric === "Revenue" ? "revenue" : "orders"}
                  stroke="#c57831"
                  strokeWidth={3}
                  fill="url(#analyticsFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel insight-panel">
          <div className="panel-header">
            <div>
              <h2>AI Insights</h2>
              <p>What the numbers are telling you</p>
            </div>
            <Sparkles />
          </div>
          <div className="analytics-insight">
            <Sparkles />
            <strong>Weekend orders are your growth engine</strong>
            <p>
              Orders increase by 42% on weekends. Consider extending rider
              coverage and featuring your top sellers from Friday to Sunday.
            </p>
            <button className="secondary-button">
              View recommendations <ChevronRight />
            </button>
          </div>
        </section>
      </div>
      <div className="analytics-lower-grid">
        <section className="panel food-sales-panel">
          <div className="panel-header">
            <div>
              <h2>Sales by Food</h2>
              <p>Your best performing menu items</p>
            </div>
            <button className="text-button">
              View all <ChevronRight />
            </button>
          </div>
          <div className="food-sales-list">
            {foodSales.map(([name, sold, amount, width], index) => (
              <div className="food-sales-row" key={name}>
                <span className="food-rank">{index + 1}</span>
                <span className="analytics-food-icon">
                  {["🍗", "🍚", "🥩", "🍱", "🥘"][index]}
                </span>
                <div>
                  <strong>{name}</strong>
                  <small>{sold} orders</small>
                  <i>
                    <em style={{ width: `${width}%` }} />
                  </i>
                </div>
                <b>{amount}</b>
              </div>
            ))}
          </div>
        </section>
        <section className="panel customer-analytics-panel">
          <div className="panel-header">
            <div>
              <h2>Customer Insights</h2>
              <p>Audience health</p>
            </div>
            <Users />
          </div>
          <div className="customer-analytics-grid">
            <div>
              <strong>3,842</strong>
              <span>Total customers</span>
              <b>+14.6%</b>
            </div>
            <div>
              <strong>64.8%</strong>
              <span>Repeat customers</span>
              <b>+1.7%</b>
            </div>
            <div>
              <strong>₵74.50</strong>
              <span>Customer lifetime</span>
              <b>+8.2%</b>
            </div>
            <div>
              <strong>4.8</strong>
              <span>Avg. rating</span>
              <b>+0.2</b>
            </div>
          </div>
        </section>
      </div>
      <section className="panel analytics-riders-panel">
        <div className="panel-header">
          <div>
            <h2>Rider Performance</h2>
            <p>Delivery team leaderboard</p>
          </div>
          <button className="text-button">
            View all <ChevronRight />
          </button>
        </div>
        <div className="analytics-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rider</th>
                <th>Deliveries</th>
                <th>Revenue generated</th>
                <th>Rating</th>
                <th>On-time rate</th>
              </tr>
            </thead>
            <tbody>
              {riders.map((row) => (
                <tr key={row[0]}>
                  <td>
                    <strong>{row[0]}</strong>
                  </td>
                  <td>{row[1]}</td>
                  <td>{row[2]}</td>
                  <td className="table-rating">★ {row[3]}</td>
                  <td>
                    <span className="on-time-badge">{row[4]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
function PaymentsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PaymentStatus | "all">("all");
  const [method, setMethod] = useState<PaymentMethod | "all">("all");
  const [dateRange, setDateRange] = useState("all");
  const [sort, setSort] = useState("created_desc");
  const [paymentsData, setPaymentsData] = useState<Payment[]>([]);
  const [selected, setSelected] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPayments() {
    setLoading(true);
    setError("");
    try {
      setPaymentsData(await getPayments());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load payments.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPayments();
  }, []);

  const rows = useMemo(() => {
    const search = query.trim().toLowerCase();
    const now = Date.now();
    const rangeStart =
      dateRange === "today"
        ? new Date(new Date().setHours(0, 0, 0, 0)).getTime()
        : dateRange === "7"
          ? now - 7 * 24 * 60 * 60 * 1000
          : dateRange === "30"
            ? now - 30 * 24 * 60 * 60 * 1000
            : null;

    return paymentsData
      .filter((payment) => {
        const searchable = [
          payment.transaction_id,
          payment.order?.order_number,
          payment.customer?.full_name,
          payment.customer?.email,
          payment.provider,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return (
          (!search || searchable.includes(search)) &&
          (status === "all" || payment.status === status) &&
          (method === "all" || payment.method === method) &&
          (rangeStart === null ||
            new Date(payment.created_at).getTime() >= rangeStart)
        );
      })
      .sort((a, b) => {
        if (sort === "amount_asc") return Number(a.amount) - Number(b.amount);
        if (sort === "amount_desc") return Number(b.amount) - Number(a.amount);
        if (sort === "paid_desc")
          return (
            new Date(b.paid_at ?? 0).getTime() -
            new Date(a.paid_at ?? 0).getTime()
          );
        if (sort === "paid_asc")
          return (
            new Date(a.paid_at ?? 0).getTime() -
            new Date(b.paid_at ?? 0).getTime()
          );
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
  }, [paymentsData, query, status, method, dateRange, sort]);

  const summary = useMemo(() => {
    const count = (value: PaymentStatus) =>
      paymentsData.filter((payment) => payment.status === value).length;
    const sum = (value?: PaymentStatus) =>
      paymentsData
        .filter((payment) => !value || payment.status === value)
        .reduce((total, payment) => total + Number(payment.amount || 0), 0);
    return {
      total: paymentsData.length,
      successful: count("successful"),
      pending: count("pending"),
      processing: count("processing"),
      failed: count("failed"),
      refunded: count("refunded"),
      totalRevenue: sum(),
      successfulRevenue: sum("successful"),
    };
  }, [paymentsData]);

  const money = (amount: number) => `₵${amount.toFixed(2)}`;
  const displayMethod = (value: PaymentMethod) =>
    ({ cash: "Cash", mobile_money: "Mobile Money", card: "Card" })[value];
  const displayStatus = (value: PaymentStatus) =>
    value.replace("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
  const statusClass = (value: PaymentStatus) =>
    value === "successful"
      ? "status-success"
      : value === "pending" || value === "processing"
        ? "status-pending"
        : value === "refunded"
          ? "status-info"
          : "status-negative";
  const date = (value: string | null) =>
    value ? new Date(value).toLocaleString() : "N/A";

  return (
    <main className="main-content payments-main">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <CreditCard /> Finance
          </div>
          <h1>Payments</h1>
          <p>Track transactions, revenue, and payment health.</p>
        </div>
        <button className="secondary-button" type="button">
          <Download /> Export report
        </button>
      </div>
      <section className="stats-grid payment-stats">
        <Stat
          title="Total Payments"
          value={String(summary.total)}
          change="All records"
          icon={CircleDollarSign}
        />
        <Stat
          title="Successful Payments"
          value={String(summary.successful)}
          change={money(summary.successfulRevenue)}
          icon={CheckCircle2}
        />
        <Stat
          title="Pending Payments"
          value={String(summary.pending)}
          change="Awaiting payment"
          icon={Wallet}
          down
        />
        <Stat
          title="Processing Payments"
          value={String(summary.processing)}
          change="In progress"
          icon={Wallet}
        />
        <Stat
          title="Failed Payments"
          value={String(summary.failed)}
          change="Needs attention"
          icon={ArrowDownRight}
          down
        />
        <Stat
          title="Refunded Payments"
          value={String(summary.refunded)}
          change="Refund records"
          icon={ArrowDownRight}
          down
        />
        <Stat
          title="Total Revenue"
          value={money(summary.totalRevenue)}
          change="All payment records"
          icon={CircleDollarSign}
        />
        <Stat
          title="Successful Revenue"
          value={money(summary.successfulRevenue)}
          change="Successful only"
          icon={CheckCircle2}
        />
      </section>
      {error && (
        <div className="login-message" role="alert">
          <span>{error}</span>
          <button className="text-button" onClick={() => void loadPayments()}>
            Retry
          </button>
        </div>
      )}
      <section className="panel payments-table-panel">
        <div className="panel-header">
          <div>
            <h2>Transactions</h2>
            <p>Every payment made through Shamsiya</p>
          </div>
          <span className="panel-count">{rows.length} payments</span>
        </div>
        <div className="payments-toolbar">
          <label className="payments-search">
            <Search />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search transaction, order, customer, or provider"
            />
          </label>
          <div className="payments-filters">
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as PaymentStatus | "all")
              }
              aria-label="Payment status"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="successful">Successful</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <select
              value={method}
              onChange={(e) =>
                setMethod(e.target.value as PaymentMethod | "all")
              }
              aria-label="Payment method"
            >
              <option value="all">All methods</option>
              <option value="cash">Cash</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="card">Card</option>
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              aria-label="Payment date range"
            >
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort payments"
            >
              <option value="created_desc">Newest first</option>
              <option value="amount_desc">Amount: high to low</option>
              <option value="amount_asc">Amount: low to high</option>
              <option value="paid_desc">Paid date: newest</option>
              <option value="paid_asc">Paid date: oldest</option>
            </select>
          </div>
        </div>
        <div className="payments-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Order</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Payment method</th>
                <th>Status</th>
                <th>Provider</th>
                <th>Paid at</th>
                <th>Created at</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((payment) => (
                <tr key={payment.id} onClick={() => setSelected(payment)}>
                  <td>
                    <button className="transaction-link" type="button">
                      {payment.transaction_id ?? "N/A"}
                    </button>
                  </td>
                  <td>{payment.order?.order_number ?? payment.order_id}</td>
                  <td>
                    {payment.customer?.full_name ??
                      payment.customer?.email ??
                      "Unknown customer"}
                  </td>
                  <td>
                    <strong>{money(Number(payment.amount || 0))}</strong>
                  </td>
                  <td>{displayMethod(payment.method)}</td>
                  <td>
                    <span
                      className={`status-badge ${statusClass(payment.status)}`}
                    >
                      {displayStatus(payment.status)}
                    </span>
                  </td>
                  <td>{payment.provider ?? "N/A"}</td>
                  <td>{date(payment.paid_at)}</td>
                  <td>{date(payment.created_at)}</td>
                  <td>
                    <MoreHorizontal className="table-more" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && rows.length === 0 && (
            <div className="empty-payments">
              <CreditCard />
              <strong>
                {paymentsData.length ? "No payments found" : "No payments yet"}
              </strong>
              <span>
                {paymentsData.length
                  ? "Try a different search or filter."
                  : "Payment records will appear here when customers complete orders."}
              </span>
            </div>
          )}
          {loading && (
            <div className="empty-payments">
              <CreditCard />
              <strong>Loading payments...</strong>
              <span>Fetching the latest payment records.</span>
            </div>
          )}
        </div>
      </section>
      {selected && (
        <div className="modal-layer" onClick={() => setSelected(null)}>
          <aside
            className="payment-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-heading">
              <div>
                <div className="eyebrow">Transaction details</div>
                <h2>{selected.transaction_id ?? "Payment details"}</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setSelected(null)}
                aria-label="Close payment details"
              >
                <X />
              </button>
            </div>
            <div className="payment-total">
              <span>Amount received</span>
              <strong>{money(Number(selected.amount || 0))}</strong>
              <span className={`status-badge ${statusClass(selected.status)}`}>
                {displayStatus(selected.status)}
              </span>
            </div>
            <dl className="payment-details">
              <div>
                <dt>Customer</dt>
                <dd>{selected.customer?.full_name ?? "Unknown customer"}</dd>
              </div>
              <div>
                <dt>Payment method</dt>
                <dd>{displayMethod(selected.method)}</dd>
              </div>
              <div>
                <dt>Payment ID</dt>
                <dd>{selected.id}</dd>
              </div>
              <div>
                <dt>Provider</dt>
                <dd>{selected.provider ?? "N/A"}</dd>
              </div>
              <div>
                <dt>Paid at</dt>
                <dd>{date(selected.paid_at)}</dd>
              </div>
              <div>
                <dt>Created at</dt>
                <dd>{date(selected.created_at)}</dd>
              </div>
              <div>
                <dt>Customer email</dt>
                <dd>{selected.customer?.email ?? "N/A"}</dd>
              </div>
              <div>
                <dt>Customer phone</dt>
                <dd>{selected.customer?.phone ?? "N/A"}</dd>
              </div>
              <div>
                <dt>Order</dt>
                <dd>{selected.order?.order_number ?? selected.order_id}</dd>
              </div>
              <div>
                <dt>Order status</dt>
                <dd>{selected.order?.status ?? "N/A"}</dd>
              </div>
              <div>
                <dt>Order total</dt>
                <dd>
                  {selected.order?.total == null
                    ? "N/A"
                    : money(Number(selected.order.total))}
                </dd>
              </div>
              <div>
                <dt>Order date</dt>
                <dd>{date(selected.order?.created_at ?? null)}</dd>
              </div>
            </dl>
            <button className="primary-button drawer-action" type="button">
              View order details <ChevronRight />
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}
export { AnalyticsPage, PaymentsPage };
export default AnalyticsPage;
