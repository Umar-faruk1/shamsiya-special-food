import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { CheckCircle2, Star } from "lucide-react-native";
import { PrimaryButton } from "./Buttons";
import type { CustomerOrderItem } from "../api/orders";
import {
  createCustomerReview,
  CustomerReview,
  fetchCustomerOrderReviews,
} from "../api/reviews";

interface OrderReviewSectionProps {
  orderId: string;
  customerId: string;
  items: CustomerOrderItem[];
  riderId: string | null;
  riderName?: string | null;
}

type ReviewTarget = {
  key: string;
  orderId: string;
  label: string;
  menuItemId: string | null;
  riderId: string | null;
};

function friendlyReviewError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (
    message.includes("already") ||
    message.includes("duplicate") ||
    message.includes("unique")
  ) {
    return "You have already reviewed this for this order.";
  }
  if (message.includes("delivered")) {
    return "Reviews are available after an order is delivered.";
  }
  return "We could not submit your review. Please try again.";
}

function StarRating({
  rating,
  onChange,
  disabled = false,
}: {
  rating: number;
  onChange?: (rating: number) => void;
  disabled?: boolean;
}) {
  return (
    <View className="flex-row items-center gap-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <Pressable
          key={value}
          disabled={disabled}
          onPress={() => onChange?.(value)}
          className="h-11 w-11 items-center justify-center"
          accessibilityLabel={`${value} star${value === 1 ? "" : "s"}`}
          accessibilityRole="button"
        >
          <Star
            width={26}
            height={26}
            color={value <= rating ? "#F59E0B" : "#C9BDB5"}
            fill={value <= rating ? "#F59E0B" : "none"}
          />
        </Pressable>
      ))}
    </View>
  );
}

function ReviewCard({
  target,
  review,
  onSubmitted,
}: {
  target: ReviewTarget;
  review?: CustomerReview;
  onSubmitted: (review: CustomerReview) => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (rating < 1 || rating > 5) {
      Alert.alert(
        "Rating required",
        "Please select a rating before submitting.",
      );
      return;
    }
    setSubmitting(true);
    try {
      const result = await createCustomerReview({
        orderId: target.orderId,
        rating,
        comment: comment.trim() || null,
        menuItemId: target.menuItemId,
        riderId: target.riderId,
      });
      if (!result.review_id) throw new Error("Review response was incomplete.");
      onSubmitted({
        id: result.review_id,
        order_id: result.order_id || target.orderId,
        customer_id: "",
        rider_id: result.rider_id ?? target.riderId,
        menu_item_id: result.menu_item_id ?? target.menuItemId,
        rating: result.rating ?? rating,
        comment: result.comment ?? (comment.trim() || null),
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Unable to submit customer review:", error);
      Alert.alert("Review not submitted", friendlyReviewError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="gap-2 rounded-2xl border border-[#613D2D]/10 bg-[#FDFBF7] p-3">
      <Text className="text-sm font-extrabold text-[#2D1810]">
        {target.label}
      </Text>
      {review ? (
        <View className="gap-1">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-[#8E7668]">
            Your Review
          </Text>
          <StarRating rating={review.rating} disabled />
          {review.comment ? (
            <Text className="text-xs text-[#613D2D]">{review.comment}</Text>
          ) : null}
          <View className="flex-row items-center gap-1">
            <CheckCircle2 width={14} height={14} color="#059669" />
            <Text className="text-[10px] font-bold text-emerald-700">
              Reviewed
            </Text>
          </View>
        </View>
      ) : (
        <>
          <Text className="text-xs text-[#8E7668]">
            {target.riderId ? "How was your delivery?" : "How was your meal?"}
          </Text>
          <StarRating
            rating={rating}
            onChange={setRating}
            disabled={submitting}
          />
          <TextInput
            value={comment}
            onChangeText={setComment}
            editable={!submitting}
            multiline
            placeholder="Write a comment... (optional)"
            placeholderTextColor="#A9998F"
            className="min-h-16 rounded-xl border border-[#613D2D]/15 bg-white px-3 py-2.5 text-xs text-[#2D1810]"
          />
          <PrimaryButton
            loading={submitting}
            disabled={submitting}
            onPress={() => void submit()}
          >
            Submit {target.riderId ? "Rider" : "Food"} Review
          </PrimaryButton>
        </>
      )}
    </View>
  );
}

export function OrderReviewSection({
  orderId,
  customerId,
  items,
  riderId,
  riderName,
}: OrderReviewSectionProps) {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReviews(await fetchCustomerOrderReviews(orderId, customerId));
    } catch (loadError) {
      console.error("Unable to load customer reviews:", loadError);
      setError("Unable to load existing reviews. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [customerId, orderId]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const foodTargets = Array.from(
    new Map(
      items
        .filter((item) => item.menu_item_id)
        .map((item) => [item.menu_item_id as string, item.name]),
    ),
  ).map(([menuItemId, label]) => ({
    key: `${orderId}:food:${menuItemId}`,
    orderId,
    label,
    menuItemId,
    riderId: null,
  }));
  const targets: ReviewTarget[] = [
    ...foodTargets,
    ...(riderId
      ? [
          {
            key: `${orderId}:rider:${riderId}`,
            orderId,
            label: riderName || "Your Rider",
            menuItemId: null,
            riderId,
          },
        ]
      : []),
  ];

  const reviewForTarget = (target: ReviewTarget) =>
    reviews.find((review) =>
      target.riderId
        ? review.rider_id === target.riderId
        : review.menu_item_id === target.menuItemId,
    );

  return (
    <View className="gap-3 bg-white p-4 rounded-3xl border border-[#613D2D]/12">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-extrabold uppercase tracking-wider text-[#2D1810]">
          Rate Your Order
        </Text>
        {!loading && reviews.length ? (
          <Text className="text-[10px] text-[#8E7668]">
            {reviews.length} submitted
          </Text>
        ) : null}
      </View>
      {loading ? (
        <View className="flex-row items-center gap-2">
          <ActivityIndicator size="small" color="#E86A17" />
          <Text className="text-xs text-[#8E7668]">Loading reviews...</Text>
        </View>
      ) : null}
      {error ? (
        <View className="gap-2">
          <Text className="text-xs text-red-700">{error}</Text>
          <Pressable onPress={() => void loadReviews()}>
            <Text className="text-xs font-bold text-[#E86A17]">Try again</Text>
          </Pressable>
        </View>
      ) : null}
      {!loading && !error && targets.length === 0 ? (
        <Text className="text-xs text-[#8E7668]">
          No reviewable food items or rider were returned for this order.
        </Text>
      ) : null}
      {!loading && !error ? (
        <View className="gap-3">
          {targets.map((target) => (
            <ReviewCard
              key={target.key}
              target={target}
              review={reviewForTarget(target)}
              onSubmitted={(review) =>
                setReviews((current) => [...current, review])
              }
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
