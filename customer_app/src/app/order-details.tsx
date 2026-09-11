import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronRight, MapPin, Package, RefreshCw } from "lucide-react-native";
import { AppHeader } from "../components/AppHeader";
import { ErrorState } from "../components/CommonModalsAndCards";
import { PrimaryButton } from "../components/Buttons";
import { StatusBadge } from "../components/BadgesAndRatings";
import { useApp } from "../context/AppContext";
import {
  CustomerOrder,
  CustomerOrderItem,
  fetchCustomerOrder,
} from "../api/orders";

const terminalStatuses = new Set(["delivered", "cancelled", "failed"]);

function money(value: number | string) {
  return `₵${Number(value).toFixed(2)}`;
}
function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
function optionText(value: unknown) {
  if (!Array.isArray(value)) return null;
  const names = value.flatMap((option) =>
    option &&
    typeof option === "object" &&
    "name" in option &&
    typeof option.name === "string"
      ? [option.name]
      : [],
  );
  return names.length ? names.join(", ") : null;
}

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const { authUser } = useApp();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [items, setItems] = useState<CustomerOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!authUser || !orderId) {
      setError("We could not find that order.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCustomerOrder(orderId);
      if (!result.order) throw new Error("Order not found");
      setOrder(result.order);
      setItems(result.items);
    } catch (loadError) {
      console.error("Unable to load customer order details:", loadError);
      setError("Unable to load your order information. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [authUser, orderId]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader currentScreen="Order Details" title="Order Details" showBack />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: 32,
          gap: 16,
        }}
      >
        {loading ? <ActivityIndicator size="large" color="#E86A17" /> : null}
        {error ? (
          <ErrorState message={error} onRetry={() => void loadOrder()} />
        ) : null}
        {!loading && !error && order ? (
          <>
            <View className="gap-3 bg-white p-4 rounded-3xl border border-[#613D2D]/12">
              <View className="flex-row items-start justify-between">
                <View>
                  <Text className="text-[10px] text-[#8E7668]">
                    Order number
                  </Text>
                  <Text className="text-base font-extrabold text-[#2D1810]">
                    #{order.order_number}
                  </Text>
                </View>
                <StatusBadge status={order.status} />
              </View>
              <View className="flex-row justify-between border-t border-neutral-100 pt-3">
                <View>
                  <Text className="text-[10px] text-[#8E7668]">Created</Text>
                  <Text className="text-xs font-bold text-[#2D1810]">
                    {formatDate(order.created_at)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-[10px] text-[#8E7668]">Payment</Text>
                  <Text className="text-xs font-bold text-[#2D1810]">
                    {order.payment_method || "Not specified"}
                  </Text>
                  <Text className="text-[10px] text-[#8E7668]">
                    {order.payment_status}
                  </Text>
                </View>
              </View>
            </View>

            <View className="gap-3 bg-white p-4 rounded-3xl border border-[#613D2D]/12">
              <Text className="text-xs font-extrabold uppercase tracking-wider text-[#2D1810]">
                Order Items
              </Text>
              {items.length ? (
                items.map((item) => (
                  <View
                    key={item.id}
                    className="gap-1 border-b border-neutral-100 pb-3"
                  >
                    <View className="flex-row justify-between">
                      <Text className="flex-1 text-xs font-bold text-[#2D1810]">
                        {item.quantity} x {item.name}
                      </Text>
                      <Text className="text-xs font-bold text-[#2D1810]">
                        {money(item.total_price)}
                      </Text>
                    </View>
                    <Text className="text-[10px] text-[#8E7668]">
                      Unit price: {money(item.unit_price)}
                    </Text>
                    {optionText(item.selected_options) ? (
                      <Text className="text-[10px] text-[#8E7668]">
                        Options: {optionText(item.selected_options)}
                      </Text>
                    ) : null}
                    {item.notes ? (
                      <Text className="text-[10px] text-[#8E7668]">
                        Notes: {item.notes}
                      </Text>
                    ) : null}
                  </View>
                ))
              ) : (
                <Text className="text-xs text-[#8E7668]">
                  No order items were returned.
                </Text>
              )}
            </View>

            <View className="gap-2 bg-white p-4 rounded-3xl border border-[#613D2D]/12">
              <Text className="text-xs font-extrabold uppercase tracking-wider text-[#2D1810]">
                Order Total
              </Text>
              <View className="flex-row justify-between">
                <Text className="text-xs text-[#613D2D]">Subtotal</Text>
                <Text className="text-xs font-bold text-[#2D1810]">
                  {money(order.subtotal)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-[#613D2D]">Delivery fee</Text>
                <Text className="text-xs font-bold text-[#2D1810]">
                  {money(order.delivery_fee)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-[#613D2D]">Discount</Text>
                <Text className="text-xs font-bold text-[#2D1810]">
                  -{money(order.discount)}
                </Text>
              </View>
              <View className="flex-row justify-between border-t border-neutral-100 pt-2">
                <Text className="text-sm font-black text-[#2D1810]">Total</Text>
                <Text className="text-xl font-black text-[#E86A17]">
                  {money(order.total)}
                </Text>
              </View>
            </View>

            <View className="gap-2 bg-white p-4 rounded-3xl border border-[#613D2D]/12">
              <View className="flex-row items-center gap-2">
                <MapPin width={16} height={16} color="#E86A17" />
                <Text className="text-xs font-extrabold uppercase tracking-wider text-[#2D1810]">
                  Delivery
                </Text>
              </View>
              <Text className="text-xs text-[#2D1810]">
                {order.delivery_address || "Address unavailable"}
              </Text>
              {order.customer_note ? (
                <Text className="text-xs text-[#8E7668]">
                  Instructions: {order.customer_note}
                </Text>
              ) : null}
            </View>

            {!terminalStatuses.has(order.status) ? (
              <PrimaryButton
                size="lg"
                fullWidth
                onPress={() =>
                  router.push({
                    pathname: "/ordertracking",
                    params: { orderId: order.id },
                  })
                }
                icon={<ChevronRight width={16} height={16} color="#fff" />}
              >
                Track Order
              </PrimaryButton>
            ) : (
              <View className="items-center gap-1 py-2">
                <Package width={22} height={22} color="#8E7668" />
                <Text className="text-xs text-[#8E7668]">
                  This order is no longer active.
                </Text>
              </View>
            )}
            <Pressable
              onPress={() => void loadOrder()}
              className="self-center flex-row items-center gap-1.5 py-2"
            >
              <RefreshCw width={14} height={14} color="#E86A17" />
              <Text className="text-xs font-bold text-[#E86A17]">
                Refresh details
              </Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
