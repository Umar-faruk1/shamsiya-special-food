import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Clock, CheckCircle2, ShoppingBag } from "lucide-react-native";
import { Order } from "../types";
import { OrderCard } from "../components/CartAndOrderWidgets";
import { EmptyState } from "../components/CommonModalsAndCards";
import { AppHeader } from "../components/AppHeader";
import { useApp } from "../context/AppContext";

// Direct port of OrdersScreen.tsx
export default function OrdersScreen() {
  const navigation = useRouter();
  const {
    orders,
    favorites,
    setActiveTrackingOrder,
    handleAddToCartQuick,
    showToast,
  } = useApp();
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");

  const activeOrders = orders.filter(
    (o) => o.status !== "delivered" && o.status !== "cancelled",
  );
  const completedOrders = orders.filter(
    (o) => o.status === "delivered" || o.status === "cancelled",
  );

  const currentList = activeTab === "active" ? activeOrders : completedOrders;

  const onTrackOrder = (order: Order) => {
    setActiveTrackingOrder(order);
    navigation.push("/ordertracking");
  };

  const onViewOrderDetails = (order: Order) => {
    setActiveTrackingOrder(order);
    navigation.push("/ordertracking");
  };

  const onReorder = (order: Order) => {
    order.items.forEach((it) => handleAddToCartQuick(it.food));
    showToast("Items added to your cart from previous order");
  };

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader currentScreen="Orders" favoritesCount={favorites.length} />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: 32,
          gap: 16,
        }}
      >
        {/* TABS SELECTOR */}
        <View className="flex-row bg-[#F4EFE6] p-1 rounded-2xl border border-[#613D2D]/12">
          <Pressable
            onPress={() => setActiveTab("active")}
            className={`flex-1 py-2 rounded-xl flex-row items-center justify-center gap-1.5 ${
              activeTab === "active" ? "bg-[#2D1810]" : ""
            }`}
          >
            <Clock
              width={14}
              height={14}
              color={activeTab === "active" ? "#fff" : "#8E7668"}
            />
            <Text
              className={`text-xs font-extrabold ${
                activeTab === "active" ? "text-white" : "text-[#8E7668]"
              }`}
            >
              Active Orders ({activeOrders.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("completed")}
            className={`flex-1 py-2 rounded-xl flex-row items-center justify-center gap-1.5 ${
              activeTab === "completed" ? "bg-[#2D1810]" : ""
            }`}
          >
            <CheckCircle2
              width={14}
              height={14}
              color={activeTab === "completed" ? "#fff" : "#8E7668"}
            />
            <Text
              className={`text-xs font-extrabold ${
                activeTab === "completed" ? "text-white" : "text-[#8E7668]"
              }`}
            >
              Order History ({completedOrders.length})
            </Text>
          </Pressable>
        </View>

        {/* ORDERS LIST */}
        {currentList.length > 0 ? (
          <View className="gap-3">
            {currentList.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onViewDetails={onViewOrderDetails}
                onTrackOrder={onTrackOrder}
                onReorder={onReorder}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon={<ShoppingBag width={32} height={32} color="#8E7668" />}
            title={
              activeTab === "active"
                ? "No Ongoing Deliveries"
                : "No Past Orders Yet"
            }
            description={
              activeTab === "active"
                ? "You don't have any meals in progress right now. Craving something fresh?"
                : "Your delivered order receipts will appear here."
            }
            actionText="Browse Menu"
            onAction={() => navigation.push("/explore")}
          />
        )}
      </ScrollView>
    </View>
  );
}
