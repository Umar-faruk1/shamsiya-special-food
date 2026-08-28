"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Copy,
  Download,
  Edit3,
  Eye,
  EyeOff,
  Filter,
  Gift,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Star,
  Tag,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import ShamsiyaDashboard from "./shamsiya-dashboard";

const promotions = [
  {
    name: "Weekend Jollof Fiesta",
    code: "JOLLOF20",
    type: "Percentage",
    value: "20%",
    audience: "All customers",
    uses: "284 / 500",
    revenue: "GH₵12,480",
    status: "Active",
    dates: "Aug 16 – Aug 25, 2025",
  },
  {
    name: "New Customer Welcome",
    code: "WELCOME15",
    type: "Percentage",
    value: "15%",
    audience: "New customers",
    uses: "156 / Unlimited",
    revenue: "GH₵7,820",
    status: "Active",
    dates: "Ongoing",
  },
  {
    name: "Free Delivery Friday",
    code: "FREEDELIVERY",
    type: "Free delivery",
    value: "Free",
    audience: "All customers",
    uses: "92 / 250",
    revenue: "GH₵4,260",
    status: "Active",
    dates: "Aug 22, 2025",
  },
  {
    name: "Chop Bar Lunch Deal",
    code: "LUNCH10",
    type: "Fixed amount",
    value: "GH₵10",
    audience: "Lunch lovers",
    uses: "418 / 500",
    revenue: "GH₵10,840",
    status: "Ending soon",
    dates: "Ends Aug 21, 2025",
  },
  {
    name: "Independence Day Special",
    code: "GHANA68",
    type: "Percentage",
    value: "25%",
    audience: "All customers",
    uses: "1,208 / 1,500",
    revenue: "GH₵38,620",
    status: "Scheduled",
    dates: "Oct 1 – Oct 7, 2025",
  },
  {
    name: "First Order Treat",
    code: "FIRSTBITE",
    type: "Fixed amount",
    value: "GH₵20",
    audience: "New customers",
    uses: "—",
    revenue: "GH₵0",
    status: "Draft",
    dates: "Not scheduled",
  },
] as const;

const reviews = [
  {
    id: "RV-00482",
    name: "Ama Boateng",
    initials: "AB",
    rating: 5,
    food: "Mandi Chicken",
    date: "Today, 10:32 AM",
    text: "The chicken was so tender and the jollof had the perfect smoky flavour. Fast delivery too — I will definitely order again.",
    reply: "Thanks Ama, we are delighted you enjoyed it!",
  },
  {
    id: "RV-00481",
    name: "Kojo Mensah",
    initials: "KM",
    rating: 4,
    food: "Jollof Rice & Suya",
    date: "Today, 9:48 AM",
    text: "Great portions and the suya spice was delicious. The packaging kept everything hot.",
    reply: "",
  },
  {
    id: "RV-00480",
    name: "Nana Owusu",
    initials: "NO",
    rating: 2,
    food: "Chicken Fried Rice",
    date: "Yesterday, 8:15 PM",
    text: "The food arrived late and the rice was a little dry. I expected better based on previous orders.",
    reply: "",
  },
  {
    id: "RV-00479",
    name: "Efua Addo",
    initials: "EA",
    rating: 5,
    food: "Waakye Special",
    date: "Yesterday, 5:22 PM",
    text: "Authentic, generous and beautifully packed. The shito was outstanding.",
    reply: "We appreciate the kind words, Efua!",
  },
  {
    id: "RV-00478",
    name: "Yaw Asare",
    initials: "YA",
    rating: 3,
    food: "Mandi Chicken",
    date: "Aug 17, 2025",
    text: "Tasty meal, but the delivery instructions were not followed exactly.",
    reply: "",
  },
] as const;

function Stars({ rating, small = false }: { rating: number; small?: boolean }) {
  return (
    <span
      className={`review-stars ${small ? "review-stars-small" : ""}`}
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={star <= rating ? "star-filled" : "star-empty"}
        />
      ))}
    </span>
  );
}
function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`status-badge ${value === "Active" ? "status-success" : value === "Ending soon" ? "status-pending" : value === "Scheduled" ? "status-info" : "status-neutral"}`}
    >
      <span />
      {value}
    </span>
  );
}
function PromotionModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState("");
  return (
    <div className="modal-layer" role="presentation" onClick={onClose}>
      <div
        className="promotion-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="promotion-form-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="drawer-heading">
          <div>
            <div className="eyebrow">PROMOTION BUILDER</div>
            <h2 id="promotion-form-title">Create promotion</h2>
            <p className="modal-copy">
              Set up a compelling offer for your Shamsiya customers.
            </p>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close promotion form"
          >
            <X />
          </button>
        </div>
        <div className="promotion-form-grid">
          <label>
            Promotion name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Weekend Jollof Fiesta"
            />
          </label>
          <label>
            Promotion code
            <input placeholder="e.g. JOLLOF20" />
          </label>
          <label>
            Discount type
            <select>
              <option>Percentage discount</option>
              <option>Fixed amount</option>
              <option>Free delivery</option>
            </select>
          </label>
          <label>
            Discount value
            <input placeholder="20" />
          </label>
          <label>
            Start date
            <input type="date" />
          </label>
          <label>
            End date
            <input type="date" />
          </label>
          <label>
            Minimum order
            <input placeholder="GH₵0.00" />
          </label>
          <label>
            Usage limit
            <input placeholder="Unlimited" />
          </label>
          <label className="promotion-wide">
            Customer eligibility
            <select>
              <option>All customers</option>
              <option>New customers</option>
              <option>Returning customers</option>
              <option>Selected segment</option>
            </select>
          </label>
          <label className="promotion-wide">
            Description
            <textarea
              placeholder="Tell customers about this offer..."
              rows={3}
            />
          </label>
        </div>
        <div className="food-form-footer">
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary-button"
            onClick={() => onSave(name || "New promotion")}
          >
            <CheckCircle2 />
            Save promotion
          </button>
        </div>
      </div>
    </div>
  );
}
function PromotionsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All statuses");
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState("");
  const visible = useMemo(
    () =>
      promotions.filter(
        (p) =>
          (!query ||
            `${p.name} ${p.code}`
              .toLowerCase()
              .includes(query.toLowerCase())) &&
          (filter === "All statuses" || p.status === filter),
      ),
    [query, filter],
  );
  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 1800);
  };
  return (
    <ShamsiyaDashboard>
      <main className="main-content promotions-main">
        <div className="page-heading overview-heading">
          <div>
            <div className="eyebrow">
              <span className="live-dot" /> Marketing workspace
            </div>
            <h1>Promotions</h1>
            <p>Create offers that bring more customers to the table.</p>
          </div>
          <div className="heading-actions">
            <button
              className="secondary-button"
              onClick={() => notify("Promotion report exported")}
            >
              <Download />
              Export
            </button>
            <button className="primary-button" onClick={() => setModal(true)}>
              <Plus />
              Create promotion
            </button>
          </div>
        </div>
        <section className="stats-grid promotion-stats">
          <article className="stat-card">
            <div className="stat-head">
              <span>Active promotions</span>
              <div className="stat-icon">
                <Tag />
              </div>
            </div>
            <div className="stat-value">4</div>
            <div className="stat-foot">
              <span className="trend-up">
                <TrendingUp />
                +2 this month
              </span>
              <span>running now</span>
            </div>
          </article>
          <article className="stat-card">
            <div className="stat-head">
              <span>Redemptions</span>
              <div className="stat-icon">
                <Gift />
              </div>
            </div>
            <div className="stat-value">2,158</div>
            <div className="stat-foot">
              <span className="trend-up">
                <TrendingUp />
                18.4%
              </span>
              <span>vs previous period</span>
            </div>
          </article>
          <article className="stat-card">
            <div className="stat-head">
              <span>Revenue influenced</span>
              <div className="stat-icon">
                <BarChart3 />
              </div>
            </div>
            <div className="stat-value">GH₵74.0k</div>
            <div className="stat-foot">
              <span className="trend-up">
                <TrendingUp />
                22.8%
              </span>
              <span>from promotions</span>
            </div>
          </article>
          <article className="stat-card">
            <div className="stat-head">
              <span>Avg. order uplift</span>
              <div className="stat-icon">
                <Users />
              </div>
            </div>
            <div className="stat-value">31.6%</div>
            <div className="stat-foot">
              <span className="trend-up">
                <TrendingUp />
                6.2%
              </span>
              <span>when redeemed</span>
            </div>
          </article>
        </section>
        <section className="campaign-grid">
          <article className="campaign-card campaign-featured">
            <div className="campaign-ribbon">TOP PERFORMER</div>
            <div className="campaign-icon">
              <Gift />
            </div>
            <div>
              <h2>Weekend Jollof Fiesta</h2>
              <p>20% off all rice dishes</p>
            </div>
            <strong>GH₵12,480</strong>
            <small>revenue influenced</small>
            <div className="campaign-progress">
              <span>
                <i style={{ width: "57%" }} />
              </span>
              <small>284 of 500 redemptions</small>
            </div>
            <button
              className="text-button"
              onClick={() => notify("Promotion details opened")}
            >
              View campaign <ChevronRight />
            </button>
          </article>
          <article className="campaign-card">
            <div className="campaign-icon green">
              <Send />
            </div>
            <div>
              <h2>New Customer Welcome</h2>
              <p>15% off first order</p>
            </div>
            <strong>GH₵7,820</strong>
            <small>revenue influenced</small>
            <div className="campaign-progress">
              <span>
                <i style={{ width: "31%" }} />
              </span>
              <small>156 redemptions</small>
            </div>
            <button
              className="text-button"
              onClick={() => notify("Promotion details opened")}
            >
              View campaign <ChevronRight />
            </button>
          </article>
          <article className="campaign-card">
            <div className="campaign-icon purple">
              <Clock3 />
            </div>
            <div>
              <h2>Chop Bar Lunch Deal</h2>
              <p>GH₵10 off orders over GH₵60</p>
            </div>
            <strong>GH₵10,840</strong>
            <small>revenue influenced</small>
            <div className="campaign-progress">
              <span>
                <i style={{ width: "84%" }} />
              </span>
              <small>ending in 2 days</small>
            </div>
            <button
              className="text-button"
              onClick={() => notify("Promotion details opened")}
            >
              View campaign <ChevronRight />
            </button>
          </article>
        </section>
        <section className="panel promotion-table-panel">
          <div className="panel-header">
            <div>
              <h2>All promotions</h2>
              <p>Manage codes, eligibility, and campaign performance</p>
            </div>
            <span className="panel-count">{visible.length} campaigns</span>
          </div>
          <div className="promotion-toolbar">
            <label className="promotion-search">
              <Search />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search promotions or codes..."
              />
            </label>
            <div className="promotion-filters">
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                aria-label="Filter promotions"
              >
                <option>All statuses</option>
                <option>Active</option>
                <option>Ending soon</option>
                <option>Scheduled</option>
                <option>Draft</option>
              </select>
              <button
                className="secondary-button filter-button"
                onClick={() => notify("Advanced filters coming soon")}
              >
                <Filter />
                Filters
              </button>
            </div>
          </div>
          <div className="promotion-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Promotion</th>
                  <th>Offer</th>
                  <th>Audience</th>
                  <th>Redemptions</th>
                  <th>Revenue</th>
                  <th>Status</th>
                  <th>Dates</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((promotion) => (
                  <tr key={promotion.code}>
                    <td>
                      <div className="promotion-name">
                        <span className="promotion-row-icon">
                          <Tag />
                        </span>
                        <span>
                          <strong>{promotion.name}</strong>
                          <small>
                            {promotion.code} <Copy />
                          </small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <strong>{promotion.value}</strong>
                      <small>{promotion.type}</small>
                    </td>
                    <td>{promotion.audience}</td>
                    <td>{promotion.uses}</td>
                    <td>
                      <strong>{promotion.revenue}</strong>
                    </td>
                    <td>
                      <StatusBadge value={promotion.status} />
                    </td>
                    <td>
                      <small>{promotion.dates}</small>
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        onClick={() => notify(`Editing ${promotion.name}`)}
                        aria-label={`Edit ${promotion.name}`}
                      >
                        <MoreHorizontal />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visible.length === 0 && (
              <div className="empty-promotions">
                <Search />
                <strong>No promotions found</strong>
                <span>Try a different campaign name or status.</span>
              </div>
            )}
          </div>
          <div className="panel-footer">
            <span>
              Showing {visible.length} of {promotions.length} promotions
            </span>
            <button
              className="text-button"
              onClick={() => notify("All promotions loaded")}
            >
              View all promotions <ChevronRight />
            </button>
          </div>
        </section>
      </main>
      {modal && (
        <PromotionModal
          onClose={() => setModal(false)}
          onSave={(name) => {
            setModal(false);
            notify(`${name} saved as draft`);
          }}
        />
      )}
      {toast && (
        <div className="toast-message">
          <CheckCircle2 />
          {toast}
        </div>
      )}
    </ShamsiyaDashboard>
  );
}
function ReviewsPage() {
  const [filter, setFilter] = useState("All ratings");
  const [hidden, setHidden] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 1800);
  };
  const visible = reviews.filter(
    (review) =>
      (filter === "All ratings" ||
        review.rating === Number(filter.split(" ")[0])) &&
      !hidden.includes(review.id),
  );
  return (
    <ShamsiyaDashboard>
      <main className="main-content reviews-main">
        <div className="page-heading overview-heading">
          <div>
            <div className="eyebrow">
              <span className="live-dot" /> Customer voice
            </div>
            <h1>Reviews</h1>
            <p>See what guests are saying about every Shamsiya meal.</p>
          </div>
          <div className="heading-actions">
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filter reviews"
            >
              <option>All ratings</option>
              <option>5 stars</option>
              <option>4 stars</option>
              <option>3 stars</option>
              <option>2 stars</option>
              <option>1 stars</option>
            </select>
            <button
              className="secondary-button"
              onClick={() => notify("Review report exported")}
            >
              <Download />
              Export
            </button>
          </div>
        </div>
        <section className="reviews-summary">
          <article className="panel rating-summary-card">
            <div className="rating-score">
              <strong>4.8</strong>
              <Stars rating={5} />
              <span>Based on 2,486 reviews</span>
              <b>
                <TrendingUp />
                +0.3 vs last month
              </b>
            </div>
            <div className="rating-bars">
              {[
                [5, 1874, 75],
                [4, 398, 16],
                [3, 126, 5],
                [2, 57, 2],
                [1, 31, 1],
              ].map(([rating, count, percentage]) => (
                <div key={rating}>
                  <span>
                    {rating} <Star />
                  </span>
                  <i>
                    <em style={{ width: `${percentage}%` }} />
                  </i>
                  <b>{count}</b>
                </div>
              ))}
            </div>
          </article>
          <article className="panel review-highlight-card">
            <div className="highlight-icon">
              <Star />
            </div>
            <div>
              <span>Most loved today</span>
              <h2>Mandi Chicken</h2>
              <Stars rating={5} small />
              <p>“Tender, smoky and packed with flavour.”</p>
              <small>94% positive sentiment</small>
            </div>
          </article>
          <article className="panel review-highlight-card soft-green">
            <div className="highlight-icon">
              <Users />
            </div>
            <div>
              <span>Response rate</span>
              <h2>87.4%</h2>
              <p>Average response time: 2h 18m</p>
              <button
                className="text-button"
                onClick={() => notify("Response inbox opened")}
              >
                Open response inbox <ChevronRight />
              </button>
            </div>
          </article>
        </section>
        <section className="panel review-list-panel">
          <div className="panel-header">
            <div>
              <h2>Recent reviews</h2>
              <p>Moderate feedback and keep the conversation warm</p>
            </div>
            <span className="panel-count">{visible.length} visible</span>
          </div>
          <div className="review-filter-row">
            <span>Filter by rating</span>
            <div>
              {[
                "All ratings",
                "5 stars",
                "4 stars",
                "3 stars",
                "2 stars",
                "1 stars",
              ].map((item) => (
                <button
                  key={item}
                  className={filter === item ? "review-filter-active" : ""}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="review-list">
            {visible.map((review) => (
              <article
                className={`review-card ${review.rating <= 2 ? "review-negative" : ""}`}
                key={review.id}
              >
                <div className="review-card-top">
                  <div className="reviewer">
                    <div className="avatar avatar-sm">{review.initials}</div>
                    <span>
                      <strong>{review.name}</strong>
                      <small>
                        {review.date} · {review.food}
                      </small>
                    </span>
                  </div>
                  <Stars rating={review.rating} />
                  <button
                    className="icon-button"
                    onClick={() => {
                      setHidden((current) => [...current, review.id]);
                      notify("Review hidden from public view");
                    }}
                    aria-label={`Hide review from ${review.name}`}
                  >
                    <EyeOff />
                  </button>
                </div>
                <p className="review-text">{review.text}</p>
                {review.reply ? (
                  <div className="review-reply">
                    <CheckCircle2 />
                    <span>
                      <b>Your reply</b>
                      {review.reply}
                    </span>
                    <button
                      className="text-button"
                      onClick={() => notify("Reply editor opened")}
                    >
                      <Edit3 />
                    </button>
                  </div>
                ) : (
                  <button
                    className="reply-button"
                    onClick={() =>
                      notify(`Reply editor opened for ${review.name}`)
                    }
                  >
                    <Send />
                    Reply to review
                  </button>
                )}
              </article>
            ))}
            {visible.length === 0 && (
              <div className="empty-promotions">
                <EyeOff />
                <strong>No reviews match this filter</strong>
                <span>Try a different rating.</span>
              </div>
            )}
          </div>
        </section>
      </main>
      {toast && (
        <div className="toast-message">
          <CheckCircle2 />
          {toast}
        </div>
      )}
    </ShamsiyaDashboard>
  );
}
export { PromotionsPage, ReviewsPage };
