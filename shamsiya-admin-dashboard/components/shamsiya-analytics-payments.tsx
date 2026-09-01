"use client";

import { useMemo, useState } from "react";
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
function paymentStatus(value: string) {
  return value === "Paid"
    ? "status-success"
    : value === "Pending"
      ? "status-pending"
      : "status-negative";
}
function PaymentsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [selected, setSelected] = useState<(typeof payments)[number] | null>(
    null,
  );
  const rows = useMemo(
    () =>
      payments.filter(
        (row) =>
          `${row[0]} ${row[1]} ${row[2]}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (status === "All statuses" || row[4] === status),
      ),
    [query, status],
  );
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
        <button className="secondary-button">
          <Download /> Export report
        </button>
      </div>
      <section className="stats-grid payment-stats">
        <Stat
          title="Total Revenue"
          value="₵286,450"
          change="12.5%"
          icon={CircleDollarSign}
        />
        <Stat
          title="Successful Payments"
          value="₵268,210"
          change="93.6%"
          icon={CheckCircle2}
        />
        <Stat
          title="Pending Payments"
          value="₵8,420"
          change="18 transactions"
          icon={Wallet}
          down
        />
        <Stat
          title="Refunds"
          value="₵9,820"
          change="12 refunds"
          icon={ArrowDownRight}
          down
        />
      </section>
      <section className="panel payments-table-panel">
        <div className="panel-header">
          <div>
            <h2>Transactions</h2>
            <p>Every payment made through Shamsiya</p>
          </div>
          <span className="panel-count">{rows.length} transactions</span>
        </div>
        <div className="payments-toolbar">
          <label className="payments-search">
            <Search />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search transaction or customer"
            />
          </label>
          <div className="payments-filters">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Payment status"
            >
              <option>All statuses</option>
              <option>Paid</option>
              <option>Pending</option>
              <option>Refunded</option>
            </select>
            <select aria-label="Payment method">
              <option>All methods</option>
              <option>Visa</option>
              <option>Mobile Money</option>
            </select>
            <button className="filter-button">
              <Filter /> Filters
            </button>
          </div>
        </div>
        <div className="payments-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Payment method</th>
                <th>Status</th>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[0]} onClick={() => setSelected(row)}>
                  <td>
                    <button className="transaction-link">#{row[0]}</button>
                  </td>
                  <td>{row[1]}</td>
                  <td>
                    <strong>{row[2]}</strong>
                  </td>
                  <td>{row[3]}</td>
                  <td>
                    <span className={`status-badge ${paymentStatus(row[4])}`}>
                      {row[4]}
                    </span>
                  </td>
                  <td>{row[5]}</td>
                  <td>
                    <MoreHorizontal className="table-more" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="empty-payments">
              <Search />
              <strong>No payments found</strong>
              <span>Try a different search or status filter.</span>
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
                <h2>#{selected[0]}</h2>
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
              <strong>{selected[2]}</strong>
              <span className={`status-badge ${paymentStatus(selected[4])}`}>
                {selected[4]}
              </span>
            </div>
            <dl className="payment-details">
              <div>
                <dt>Customer</dt>
                <dd>{selected[1]}</dd>
              </div>
              <div>
                <dt>Payment method</dt>
                <dd>{selected[3]}</dd>
              </div>
              <div>
                <dt>Processed</dt>
                <dd>{selected[5]}</dd>
              </div>
              <div>
                <dt>Order</dt>
                <dd>#{selected[0]}</dd>
              </div>
            </dl>
            <button className="primary-button drawer-action">
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
