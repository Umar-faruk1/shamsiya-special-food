"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Download,
  Edit3,
  EyeOff,
  Filter,
  Image as ImageIcon,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Star,
  Tag,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import ShamsiyaDashboard from "./shamsiya-dashboard";
import {
  getReviews,
  getReviewStats,
  type Review,
} from "@/lib/services/reviews";
import {
  createPromotion,
  deletePromotion,
  getPromotions,
  togglePromotion,
  updatePromotion,
  type Promotion,
  type PromotionDiscountType,
  type PromotionInput,
} from "@/lib/services/promotions";

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

type PromotionFormProps = {
  promotion: Promotion | null;
  onClose: () => void;
  onSave: (input: PromotionInput) => Promise<void>;
};

function PromotionForm({ promotion, onClose, onSave }: PromotionFormProps) {
  const [title, setTitle] = useState(promotion?.title ?? "");
  const [description, setDescription] = useState(promotion?.description ?? "");
  const [imageUrl, setImageUrl] = useState(promotion?.image_url ?? "");
  const [discountType, setDiscountType] = useState<PromotionDiscountType>(
    promotion?.discount_type ?? "percentage",
  );
  const [discountValue, setDiscountValue] = useState(
    String(promotion?.discount_value ?? ""),
  );
  const [minimumOrder, setMinimumOrder] = useState(
    String(promotion?.minimum_order ?? 0),
  );
  const [maxDiscount, setMaxDiscount] = useState(
    promotion?.max_discount == null ? "" : String(promotion.max_discount),
  );
  const [promoCode, setPromoCode] = useState(promotion?.promo_code ?? "");
  const [startDate, setStartDate] = useState(
    promotion?.start_date?.slice(0, 16) ?? "",
  );
  const [endDate, setEndDate] = useState(
    promotion?.end_date?.slice(0, 16) ?? "",
  );
  const [isActive, setIsActive] = useState(promotion?.is_active ?? true);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(discountValue);
    const minimum = Number(minimumOrder || 0);
    const maximum = maxDiscount === "" ? null : Number(maxDiscount);
    if (!title.trim()) return setFormError("Title is required.");
    if (!Number.isFinite(value) || value <= 0)
      return setFormError("Discount value must be greater than 0.");
    if (discountType === "percentage" && value > 100)
      return setFormError("Percentage discounts cannot exceed 100%.");
    if (!Number.isFinite(minimum) || minimum < 0)
      return setFormError("Minimum order cannot be negative.");
    if (maximum !== null && (!Number.isFinite(maximum) || maximum < 0))
      return setFormError("Maximum discount cannot be negative.");
    if (
      startDate &&
      endDate &&
      new Date(endDate).getTime() < new Date(startDate).getTime()
    )
      return setFormError("End date cannot be earlier than the start date.");
    setFormError("");
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        discount_type: discountType,
        discount_value: value,
        minimum_order: minimum,
        max_discount: maximum,
        promo_code: promoCode.trim() || null,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        is_active: isActive,
      });
    } catch (saveError) {
      setFormError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save promotion.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-layer" role="presentation" onClick={onClose}>
      <form
        className="promotion-modal"
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="drawer-heading">
          <div>
            <div className="eyebrow">PROMOTION BUILDER</div>
            <h2>{promotion ? "Edit promotion" : "Create promotion"}</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close promotion form"
          >
            <X />
          </button>
        </div>
        {formError && (
          <div className="login-message" role="alert">
            {formError}
          </div>
        )}
        <div className="promotion-form-grid">
          <label>
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>
          <label>
            Promo code
            <input
              value={promoCode}
              onChange={(event) => setPromoCode(event.target.value)}
              placeholder="Optional"
            />
          </label>
          <label>
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />
          </label>
          <label>
            Image URL
            <input
              type="url"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="Optional image URL"
            />
          </label>
          <label>
            Discount type
            <select
              value={discountType}
              onChange={(event) =>
                setDiscountType(event.target.value as PromotionDiscountType)
              }
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </label>
          <label>
            Discount value
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={discountValue}
              onChange={(event) => setDiscountValue(event.target.value)}
              required
            />
          </label>
          <label>
            Minimum order
            <input
              type="number"
              min="0"
              step="0.01"
              value={minimumOrder}
              onChange={(event) => setMinimumOrder(event.target.value)}
            />
          </label>
          <label>
            Maximum discount
            <input
              type="number"
              min="0"
              step="0.01"
              value={maxDiscount}
              onChange={(event) => setMaxDiscount(event.target.value)}
              placeholder="Optional"
            />
          </label>
          <label>
            Start date
            <input
              type="datetime-local"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>
          <label>
            End date
            <input
              type="datetime-local"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
          <label className="promotion-toggle">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />{" "}
            Active
          </label>
        </div>
        <div className="food-form-footer">
          <button className="secondary-button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" disabled={saving}>
            {saving ? <Loader2 className="spin" /> : <CheckCircle2 />}{" "}
            {saving ? "Saving..." : "Save promotion"}
          </button>
        </div>
      </form>
    </div>
  );
}

type PromotionStatus =
  | "Active"
  | "Inactive"
  | "Running"
  | "Upcoming"
  | "Expired";
function promotionStatus(
  promotion: Promotion,
  now = Date.now(),
): PromotionStatus {
  if (!promotion.is_active) return "Inactive";
  const starts =
    !promotion.start_date || new Date(promotion.start_date).getTime() <= now;
  const ends =
    !promotion.end_date || new Date(promotion.end_date).getTime() >= now;
  if (starts && ends) return "Running";
  if (promotion.start_date && new Date(promotion.start_date).getTime() > now)
    return "Upcoming";
  return "Expired";
}

function PromotionsPage() {
  const [items, setItems] = useState<Promotion[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [formPromotion, setFormPromotion] = useState<
    Promotion | null | undefined
  >(undefined);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };
  async function load() {
    setLoading(true);
    setError("");
    try {
      setItems(await getPromotions());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load promotions.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    const now = Date.now();
    return items
      .filter((item) => {
        const text =
          `${item.title} ${item.promo_code ?? ""} ${item.description ?? ""}`.toLowerCase();
        const state = promotionStatus(item, now);
        return (
          (!query.trim() || text.includes(query.trim().toLowerCase())) &&
          (filter === "all" ||
            (filter === "active" && item.is_active) ||
            (filter === "inactive" && !item.is_active) ||
            state.toLowerCase() === filter)
        );
      })
      .sort((a, b) => {
        if (sort === "oldest")
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        if (sort === "title") return a.title.localeCompare(b.title);
        if (sort === "start")
          return (
            new Date(a.start_date ?? 8640000000000000).getTime() -
            new Date(b.start_date ?? 8640000000000000).getTime()
          );
        if (sort === "end")
          return (
            new Date(a.end_date ?? 8640000000000000).getTime() -
            new Date(b.end_date ?? 8640000000000000).getTime()
          );
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
  }, [items, query, filter, sort]);

  const stats = useMemo(
    () => ({
      total: items.length,
      active: items.filter((item) => item.is_active).length,
      inactive: items.filter((item) => !item.is_active).length,
      running: items.filter((item) => promotionStatus(item) === "Running")
        .length,
    }),
    [items],
  );
  const discount = (item: Promotion) =>
    item.discount_type === "percentage"
      ? `${item.discount_value}% OFF`
      : `GH₵ ${Number(item.discount_value).toFixed(2)} OFF`;
  const date = (value: string | null) =>
    value ? new Date(value).toLocaleDateString() : "No limit";
  const badgeClass = (status: PromotionStatus) =>
    status === "Running"
      ? "status-success"
      : status === "Upcoming"
        ? "status-info"
        : status === "Expired"
          ? "status-negative"
          : status === "Inactive"
            ? "status-neutral"
            : "status-success";

  async function save(input: PromotionInput) {
    const saved = formPromotion
      ? await updatePromotion(formPromotion.id, input)
      : await createPromotion(input);
    setItems((current) =>
      formPromotion
        ? current.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...current],
    );
    setFormPromotion(undefined);
    notify(formPromotion ? "Promotion updated" : "Promotion created");
  }
  async function toggle(item: Promotion) {
    if (
      !window.confirm(
        `${item.is_active ? "Deactivate" : "Activate"} ${item.title}?`,
      )
    )
      return;
    try {
      const updated = await togglePromotion(item.id, !item.is_active);
      setItems((current) =>
        current.map((row) => (row.id === updated.id ? updated : row)),
      );
      notify(
        updated.is_active ? "Promotion activated" : "Promotion deactivated",
      );
    } catch (toggleError) {
      notify(
        toggleError instanceof Error
          ? toggleError.message
          : "Unable to update promotion.",
      );
    }
  }
  async function remove(item: Promotion) {
    if (!window.confirm(`Delete ${item.title}? This cannot be undone.`)) return;
    try {
      await deletePromotion(item.id);
      setItems((current) => current.filter((row) => row.id !== item.id));
      notify("Promotion deleted");
    } catch (deleteError) {
      notify(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete promotion.",
      );
    }
  }

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
              className="primary-button"
              onClick={() => setFormPromotion(null)}
            >
              <Plus /> Create promotion
            </button>
          </div>
        </div>
        <section className="stats-grid promotion-stats">
          {(
            [
              ["Total promotions", stats.total, Tag],
              ["Active promotions", stats.active, TrendingUp],
              ["Inactive promotions", stats.inactive, EyeOff],
              ["Currently running", stats.running, CheckCircle2],
            ] as [string, number, typeof Tag][]
          ).map(([label, value, Icon]) => (
            <article className="stat-card" key={label}>
              <div className="stat-head">
                <span>{label}</span>
                <div className="stat-icon">
                  <Icon />
                </div>
              </div>
              <div className="stat-value">{value}</div>
              <div className="stat-foot">
                <span>Live database value</span>
              </div>
            </article>
          ))}
        </section>
        {error && (
          <div className="login-message" role="alert">
            <span>{error}</span>
            <button className="text-button" onClick={() => void load()}>
              Retry
            </button>
          </div>
        )}
        <section className="panel promotion-table-panel">
          <div className="panel-header">
            <div>
              <h2>All promotions</h2>
              <p>Manage offers, codes, dates, and visibility.</p>
            </div>
            <span className="panel-count">{visible.length} promotions</span>
          </div>
          <div className="promotion-toolbar">
            <label className="promotion-search">
              <Search />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, code, or description..."
              />
            </label>
            <div className="promotion-filters">
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                aria-label="Filter promotions"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="running">Currently Running</option>
                <option value="upcoming">Upcoming</option>
                <option value="expired">Expired</option>
              </select>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                aria-label="Sort promotions"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="title">Title</option>
                <option value="start">Start date</option>
                <option value="end">End date</option>
              </select>
            </div>
          </div>
          <div className="promotion-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Promotion</th>
                  <th>Discount</th>
                  <th>Promo code</th>
                  <th>Minimum order</th>
                  <th>Dates</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => {
                  const state = promotionStatus(item);
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="promotion-name">
                          <span className="promotion-row-icon">
                            {item.image_url ? <ImageIcon /> : <Tag />}
                          </span>
                          <span>
                            <strong>{item.title}</strong>
                            <small>
                              {item.description || "No description"}
                            </small>
                          </span>
                        </div>
                      </td>
                      <td>
                        <strong>{discount(item)}</strong>
                        <small>
                          {item.max_discount == null
                            ? "No cap"
                            : `Max GH₵ ${Number(item.max_discount).toFixed(2)}`}
                        </small>
                      </td>
                      <td>{item.promo_code || "N/A"}</td>
                      <td>GH₵ {Number(item.minimum_order || 0).toFixed(2)}</td>
                      <td>
                        <small>
                          {date(item.start_date)} - {date(item.end_date)}
                        </small>
                      </td>
                      <td>
                        <span className={`status-badge ${badgeClass(state)}`}>
                          {state}
                        </span>
                      </td>
                      <td>
                        <small>{date(item.created_at)}</small>
                      </td>
                      <td>
                        <div className="heading-actions">
                          <button
                            className="icon-button"
                            onClick={() => setFormPromotion(item)}
                            aria-label={`Edit ${item.title}`}
                          >
                            <Edit3 />
                          </button>
                          <button
                            className="icon-button"
                            onClick={() => void toggle(item)}
                            aria-label={`${item.is_active ? "Deactivate" : "Activate"} ${item.title}`}
                          >
                            <CheckCircle2 />
                          </button>
                          <button
                            className="icon-button"
                            onClick={() => void remove(item)}
                            aria-label={`Delete ${item.title}`}
                          >
                            <MoreHorizontal />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {loading && (
              <div className="empty-promotions">
                <Loader2 className="spin" />
                <strong>Loading promotions...</strong>
                <span>Fetching live promotion data.</span>
              </div>
            )}
            {!loading && visible.length === 0 && (
              <div className="empty-promotions">
                <Tag />
                <strong>
                  {items.length ? "No promotions match" : "No promotions yet"}
                </strong>
                <span>
                  {items.length
                    ? "Try a different search or filter."
                    : "Create a promotion to start offering discounts."}
                </span>
              </div>
            )}
          </div>
        </section>
      </main>
      {formPromotion !== undefined && (
        <PromotionForm
          promotion={formPromotion}
          onClose={() => setFormPromotion(undefined)}
          onSave={save}
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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState("All ratings");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState<string[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    async function loadReviews() {
      try {
        setLoading(true);
        setError("");
        const data = await getReviews();
        setReviews(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load reviews from the database.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadReviews();
  }, []);

  const stats = useMemo(() => getReviewStats(reviews), [reviews]);

  const visible = useMemo(
    () =>
      reviews.filter(
        (review) =>
          (filter === "All ratings" ||
            review.rating === Number(filter.split(" ")[0])) &&
          (!query.trim() ||
            [
              review.customer?.full_name,
              review.customer?.email,
              review.comment,
              review.menu_item?.name,
              review.rider?.profile?.full_name,
              review.order?.order_number,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(query.trim().toLowerCase())) &&
          !hidden.includes(review.id),
      ),
    [reviews, filter, hidden, query],
  );

  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 1800);
  };

  const ratingPercentages = [5, 4, 3, 2, 1].map((rating) => {
    const count =
      stats.starCounts[rating as keyof typeof stats.starCounts] ?? 0;
    const percentage = stats.totalReviews
      ? (count / stats.totalReviews) * 100
      : 0;
    return { rating, count, percentage };
  });

  const topRated = useMemo(() => {
    if (!reviews.length) return null;

    const ranked = [...reviews].sort((a, b) => b.rating - a.rating);
    return ranked[0];
  }, [reviews]);

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

        {error && (
          <div className="login-message" role="alert">
            {error}
          </div>
        )}

        <section className="reviews-summary">
          <article className="panel rating-summary-card">
            <div className="rating-score">
              <strong>{stats.totalReviews ? stats.averageRating : 0}</strong>
              <Stars rating={Math.round(stats.averageRating || 0)} />
              <span>
                Based on {stats.totalReviews} review
                {stats.totalReviews === 1 ? "" : "s"}
              </span>
              <b>
                <TrendingUp />
                Live database rating
              </b>
            </div>
            <div className="rating-bars">
              {ratingPercentages.map(({ rating, count, percentage }) => (
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
              <span>Most loved item</span>
              <h2>{topRated?.menu_item?.name ?? "No reviews yet"}</h2>
              <Stars rating={topRated?.rating ?? 0} small />
              <p>
                {topRated?.comment
                  ? `“${topRated.comment}”`
                  : "Customer feedback is still coming in."}
              </p>
              <small>
                {topRated
                  ? `${Math.round(
                      (topRated.rating / 5) * 100,
                    )}% customer satisfaction`
                  : "Awaiting review data"}
              </small>
            </div>
          </article>

          <article className="panel review-highlight-card soft-green">
            <div className="highlight-icon">
              <Users />
            </div>
            <div>
              <span>Review volume</span>
              <h2>{stats.totalReviews}</h2>
              <p>
                {stats.totalReviews
                  ? `${Math.max(1, Math.round(stats.averageRating * 10))}% average sentiment`
                  : "No reviews submitted yet"}
              </p>
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
          <label className="promotion-search review-search">
            <Search />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search customer, food, rider, order, or comment..."
              aria-label="Search reviews"
            />
          </label>
          <div className="review-list">
            {loading ? (
              <div className="empty-promotions">
                <Star />
                <strong>Loading reviews...</strong>
                <span>Fetching the latest customer feedback.</span>
              </div>
            ) : visible.length ? (
              visible.map((review) => (
                <article
                  className={`review-card ${review.rating <= 2 ? "review-negative" : ""}`}
                  key={review.id}
                >
                  <div className="review-card-top">
                    <div className="reviewer">
                      <div className="avatar avatar-sm">
                        {(review.customer?.full_name?.split(" ")[0]?.[0] ||
                          "C") +
                          (review.customer?.full_name?.split(" ")[1]?.[0] ||
                            "")}
                      </div>
                      <span>
                        <strong>
                          {review.customer?.full_name ?? "Customer"}
                        </strong>
                        <small>
                          {new Date(review.created_at).toLocaleString()} ·{" "}
                          {review.menu_item?.name ?? "Menu item"}
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
                      aria-label={`Hide review from ${review.customer?.full_name ?? "customer"}`}
                    >
                      <EyeOff />
                    </button>
                  </div>
                  <p className="review-text">
                    {review.comment || "No comment left for this review."}
                  </p>
                  <button
                    className="text-button"
                    onClick={() => setSelectedReview(review)}
                  >
                    View review details <ChevronRight />
                  </button>
                  {review.id ? (
                    <div className="review-reply">
                      <CheckCircle2 />
                      <span>
                        <b>Order</b>
                        {review.order?.order_number
                          ? ` ${review.order.order_number}`
                          : " Review record"}
                        {review.rider?.profile?.full_name
                          ? ` · Rider ${review.rider.profile.full_name}`
                          : ""}
                      </span>
                    </div>
                  ) : null}
                  <button
                    className="reply-button"
                    onClick={() => notify("Reply editor opened")}
                  >
                    <Send />
                    Reply to review
                  </button>
                </article>
              ))
            ) : (
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
      {selectedReview && (
        <div
          className="modal-layer"
          role="presentation"
          onClick={() => setSelectedReview(null)}
        >
          <div
            className="promotion-modal review-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="drawer-heading">
              <div>
                <div className="eyebrow">REVIEW DETAILS</div>
                <h2 id="review-detail-title">
                  {selectedReview.customer?.full_name ?? "Customer review"}
                </h2>
                <Stars rating={selectedReview.rating} />
              </div>
              <button
                className="icon-button"
                onClick={() => setSelectedReview(null)}
                aria-label="Close review details"
              >
                <X />
              </button>
            </div>
            <p className="review-text">
              {selectedReview.comment || "No comment left for this review."}
            </p>
            <div className="promotion-form-grid review-detail-grid">
              <div>
                <strong>Menu item</strong>
                <span>{selectedReview.menu_item?.name ?? "Not linked"}</span>
              </div>
              <div>
                <strong>Order</strong>
                <span>
                  {selectedReview.order?.order_number ??
                    selectedReview.order_id}
                </span>
              </div>
              <div>
                <strong>Rider</strong>
                <span>
                  {selectedReview.rider?.profile?.full_name ?? "Not linked"}
                </span>
              </div>
              <div>
                <strong>Submitted</strong>
                <span>
                  {new Date(selectedReview.created_at).toLocaleString()}
                </span>
              </div>
              <div>
                <strong>Customer email</strong>
                <span>{selectedReview.customer?.email ?? "Not available"}</span>
              </div>
              <div>
                <strong>Order total</strong>
                <span>
                  {selectedReview.order?.total == null
                    ? "Not available"
                    : `GH₵${Number(selectedReview.order.total).toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </ShamsiyaDashboard>
  );
}

export { PromotionsPage, ReviewsPage };
