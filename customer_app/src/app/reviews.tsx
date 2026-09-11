import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Bike, ChevronRight, RefreshCw, Star } from "lucide-react-native";
import { AppHeader } from "../components/AppHeader";
import { EmptyState, ErrorState } from "../components/CommonModalsAndCards";
import { useApp } from "../context/AppContext";
import { CustomerReview, fetchCustomerReviews } from "../api/reviews";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Stars({ rating }: { rating: number }) {
  return (
    <View className="flex-row items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          width={16}
          height={16}
          color={value <= rating ? "#F59E0B" : "#C9BDB5"}
          fill={value <= rating ? "#F59E0B" : "none"}
        />
      ))}
    </View>
  );
}

export default function ReviewsScreen() {
  const router = useRouter();
  const { authUser, favorites } = useApp();
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(
    async (isRefresh = false) => {
      if (!authUser) {
        setReviews([]);
        setLoading(false);
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        setReviews(await fetchCustomerReviews(authUser.id));
      } catch (loadError) {
        console.error("Unable to load customer reviews:", loadError);
        setError("Unable to load your reviews. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [authUser],
  );

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader
        currentScreen="Reviews"
        title="My Reviews"
        showBack
        favoritesCount={favorites.length}
      />
      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadReviews(true)}
            tintColor="#E86A17"
          />
        }
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: 40,
          gap: 12,
        }}
      >
        <Text className="text-sm font-extrabold text-[#2D1810]">
          My Reviews & Ratings ({reviews.length})
        </Text>
        {loading ? <ActivityIndicator size="large" color="#E86A17" /> : null}
        {error ? (
          <ErrorState message={error} onRetry={() => void loadReviews()} />
        ) : null}
        {!loading && !error && !reviews.length ? (
          <EmptyState
            icon={<Star width={32} height={32} color="#E86A17" />}
            title="No reviews yet"
            description="Your reviews for delivered orders will appear here."
            actionText="View Orders"
            onAction={() => router.push("/(tabs)/orders")}
          />
        ) : null}
        {!loading && !error ? (
          <View className="gap-3">
            {reviews.map((review) => (
              <Pressable
                key={review.id}
                onPress={() =>
                  router.push({
                    pathname: "/order-details",
                    params: { orderId: review.order_id },
                  })
                }
                className="gap-2 bg-white p-3.5 rounded-3xl border border-[#613D2D]/12"
              >
                <View className="flex-row items-center justify-between gap-2">
                  <View className="flex-row items-center gap-2">
                    {review.rider_id ? (
                      <Bike width={16} height={16} color="#E86A17" />
                    ) : (
                      <Star width={16} height={16} color="#E86A17" />
                    )}
                    <Text className="text-xs font-bold text-[#2D1810]">
                      {review.rider_id ? "Rider review" : "Food review"}
                    </Text>
                  </View>
                  <Text className="text-[10px] text-[#8E7668]">
                    {formatDate(review.created_at)}
                  </Text>
                </View>
                <Stars rating={review.rating} />
                {review.comment ? (
                  <Text className="text-xs leading-relaxed text-[#613D2D]">
                    {review.comment}
                  </Text>
                ) : null}
                <View className="flex-row items-center justify-end gap-1">
                  <Text className="text-[10px] font-bold text-[#E86A17]">
                    View order
                  </Text>
                  <ChevronRight width={13} height={13} color="#E86A17" />
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}
        {!loading && !error && reviews.length ? (
          <Pressable
            onPress={() => void loadReviews(true)}
            className="self-center flex-row items-center gap-1.5 py-2"
          >
            <RefreshCw width={14} height={14} color="#E86A17" />
            <Text className="text-xs font-bold text-[#E86A17]">
              Refresh reviews
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}
