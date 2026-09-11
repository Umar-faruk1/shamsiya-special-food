import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  Bike,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  Package,
  RefreshCw,
  Star,
} from "lucide-react-native";
import { AppHeader } from "../components/AppHeader";
import { ErrorState } from "../components/CommonModalsAndCards";
import { StatusBadge } from "../components/BadgesAndRatings";
import { useApp } from "../context/AppContext";
import {
  CustomerOrderTracking,
  fetchCustomerOrderTracking,
} from "../api/orders";

const timelineStatuses = [
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
] as const;

const timelineLabels: Record<string, string> = {
  pending: "Order Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready_for_pickup: "Ready for Pickup",
  rider_assigned: "Rider Assigned",
  rider_accepted: "Rider Accepted",
  picked_up: "Picked Up",
  out_for_delivery: "Out for Delivery",
  arrived: "Rider Arrived",
  delivered: "Delivered",
};

function money(value: number | string) {
  return `₵${Number(value).toFixed(2)}`;
}
function formatTime(value: string | null | undefined) {
  return value
    ? new Date(value).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "";
}

export default function OrderTrackingScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const { authUser } = useApp();
  const [tracking, setTracking] = useState<CustomerOrderTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTracking = useCallback(
    async (isRefresh = false) => {
      if (!authUser || !orderId) {
        setError("We could not find that order.");
        setLoading(false);
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        setTracking(await fetchCustomerOrderTracking(orderId));
      } catch (loadError) {
        console.error("Unable to load customer order tracking:", loadError);
        setError("Unable to load your order information. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [authUser, orderId],
  );

  useEffect(() => {
    void loadTracking();
    const interval = setInterval(() => {
      void loadTracking(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [loadTracking]);

  const timeline = useMemo(() => {
    const status = tracking?.order.status;
    const currentIndex = status
      ? timelineStatuses.indexOf(status as (typeof timelineStatuses)[number])
      : -1;
    return timelineStatuses.map((step, index) => ({
      status: step,
      label: timelineLabels[step],
      completed: currentIndex >= 0 && index < currentIndex,
      current: currentIndex === index,
      timestamp:
        step === "pending"
          ? tracking?.order.created_at
          : step === "rider_accepted"
            ? tracking?.order.accepted_at
            : step === "picked_up"
              ? tracking?.order.picked_up_at
              : step === "delivered"
                ? tracking?.order.delivered_at
                : null,
    }));
  }, [tracking]);

  const isTerminal = tracking
    ? tracking.order.status === "cancelled" ||
      tracking.order.status === "failed" ||
      tracking.order.status === "delivered"
    : false;
  const rider = tracking?.rider;
  const profile = tracking?.rider_profile;
  const location = tracking?.location;

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader currentScreen="Order Tracking" title="Track Order" showBack />
      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadTracking(true)}
            tintColor="#E86A17"
          />
        }
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: 40,
          gap: 16,
        }}
      >
        {loading ? <ActivityIndicator size="large" color="#E86A17" /> : null}
        {error ? (
          <ErrorState message={error} onRetry={() => void loadTracking()} />
        ) : null}
        {!loading && !error && tracking ? (
          <>
            <View className="gap-3 bg-white p-4 rounded-3xl border border-[#613D2D]/12">
              <View className="flex-row items-start justify-between">
                <View>
                  <Text className="text-[10px] text-[#8E7668]">
                    Order number
                  </Text>
                  <Text className="text-base font-extrabold text-[#2D1810]">
                    #{tracking.order.order_number}
                  </Text>
                </View>
                <StatusBadge status={tracking.order.status} />
              </View>
              <View className="flex-row justify-between border-t border-neutral-100 pt-3">
                <View>
                  <Text className="text-[10px] text-[#8E7668]">Total</Text>
                  <Text className="text-sm font-black text-[#E86A17]">
                    {money(tracking.order.total)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-[10px] text-[#8E7668]">Payment</Text>
                  <Text className="text-xs font-bold text-[#2D1810]">
                    {tracking.order.payment_status}
                  </Text>
                </View>
              </View>
            </View>

            <View className="gap-3 bg-white p-4 rounded-3xl border border-[#613D2D]/12">
              <Text className="text-xs font-extrabold uppercase tracking-wider text-[#2D1810]">
                Delivery Progress
              </Text>
              {timeline.map((step, index) => (
                <View
                  key={step.status}
                  className="flex-row items-start gap-3 relative"
                >
                  {index < timeline.length - 1 ? (
                    <View
                      className={`absolute left-3.5 top-7 bottom-[-16px] w-0.5 ${step.completed ? "bg-emerald-500" : "bg-neutral-200"}`}
                    />
                  ) : null}
                  <View
                    className={`w-7 h-7 rounded-full items-center justify-center ${step.completed ? "bg-emerald-500" : step.current ? "bg-[#E86A17]" : "bg-neutral-200"}`}
                  >
                    {step.completed ? (
                      <CheckCircle2 width={16} height={16} color="#fff" />
                    ) : (
                      <View className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text
                        className={`text-xs font-extrabold ${step.current ? "text-[#E86A17]" : step.completed ? "text-[#2D1810]" : "text-neutral-400"}`}
                      >
                        {step.label}
                      </Text>
                      {step.timestamp ? (
                        <Text className="text-[9px] text-neutral-400">
                          {formatTime(step.timestamp)}
                        </Text>
                      ) : null}
                    </View>
                    {step.current ? (
                      <Text className="text-[10px] text-[#8E7668] mt-0.5">
                        Current order status
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
              {tracking.order.status === "cancelled" ||
              tracking.order.status === "failed" ? (
                <View className="mt-1 rounded-xl bg-red-50 p-3">
                  <Text className="text-xs font-bold text-red-800">
                    {tracking.order.status === "cancelled"
                      ? "This order was cancelled."
                      : "This order could not be completed."}
                  </Text>
                </View>
              ) : null}
            </View>

            <View className="gap-3 bg-white p-4 rounded-3xl border border-[#613D2D]/12">
              <View className="flex-row items-center gap-2">
                <MapPin width={16} height={16} color="#E86A17" />
                <Text className="text-xs font-extrabold uppercase tracking-wider text-[#2D1810]">
                  Live Location
                </Text>
              </View>
              {location?.latitude !== null &&
              location?.latitude !== undefined &&
              location?.longitude !== null &&
              location?.longitude !== undefined ? (
                <View className="gap-2 rounded-2xl bg-[#F4EFE6] p-4">
                  <View className="flex-row items-center gap-2">
                    <Navigation width={18} height={18} color="#E86A17" />
                    <Text className="text-xs font-bold text-[#2D1810]">
                      Rider location available
                    </Text>
                  </View>
                  <Text className="text-[11px] text-[#613D2D]">
                    Latitude {location.latitude.toFixed(6)} · Longitude{" "}
                    {location.longitude.toFixed(6)}
                  </Text>
                  {location.updated_at ? (
                    <Text className="text-[10px] text-[#8E7668]">
                      Updated {formatTime(location.updated_at)}
                    </Text>
                  ) : null}
                </View>
              ) : (
                <View className="gap-1 rounded-2xl bg-[#F4EFE6] p-4">
                  <Text className="text-xs font-bold text-[#2D1810]">
                    Rider location is not available yet.
                  </Text>
                  <Text className="text-[10px] text-[#8E7668]">
                    We will refresh this section as delivery information
                    changes.
                  </Text>
                </View>
              )}
              {tracking.order.delivery_latitude !== null &&
              tracking.order.delivery_longitude !== null ? (
                <Text className="text-[10px] text-[#8E7668]">
                  Delivery coordinates are available for this order.
                </Text>
              ) : (
                <Text className="text-[10px] text-[#8E7668]">
                  Delivery location coordinates are unavailable.
                </Text>
              )}
            </View>

            <View className="gap-3 bg-white p-4 rounded-3xl border border-[#613D2D]/12">
              <View className="flex-row items-center gap-2">
                <Bike width={16} height={16} color="#E86A17" />
                <Text className="text-xs font-extrabold uppercase tracking-wider text-[#2D1810]">
                  Rider
                </Text>
              </View>
              {rider ? (
                <>
                  <View className="flex-row items-center gap-3">
                    <View className="w-11 h-11 rounded-2xl bg-[#F4EFE6] items-center justify-center">
                      <Bike width={20} height={20} color="#2D1810" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-extrabold text-[#2D1810]">
                        {profile?.full_name || "Assigned rider"}
                      </Text>
                      <Text className="text-[11px] text-[#8E7668]">
                        {rider.vehicle_type || "Vehicle unavailable"}
                        {rider.vehicle_number
                          ? ` · ${rider.vehicle_number}`
                          : ""}
                      </Text>
                    </View>
                    {rider.rating !== null ? (
                      <View className="flex-row items-center gap-1">
                        <Star
                          width={13}
                          height={13}
                          color="#F59E0B"
                          fill="#F59E0B"
                        />
                        <Text className="text-xs font-bold text-[#2D1810]">
                          {Number(rider.rating).toFixed(1)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text
                    className={`text-xs font-bold ${rider.is_online ? "text-emerald-700" : "text-[#8E7668]"}`}
                  >
                    {rider.is_online ? "Online" : "Offline"}
                  </Text>
                </>
              ) : (
                <Text className="text-xs text-[#8E7668]">
                  Your order is waiting for a rider to be assigned.
                </Text>
              )}
            </View>

            <Pressable
              onPress={() => void loadTracking(true)}
              className="self-center flex-row items-center gap-1.5 py-2"
            >
              <RefreshCw width={14} height={14} color="#E86A17" />
              <Text className="text-xs font-bold text-[#E86A17]">
                Refresh tracking
              </Text>
            </Pressable>
            {isTerminal ? (
              <Text className="text-center text-[10px] text-[#8E7668]">
                This order is no longer active, but its delivery information
                remains available.
              </Text>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
