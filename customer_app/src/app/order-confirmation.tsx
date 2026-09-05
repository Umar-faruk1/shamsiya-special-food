import React from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { CheckCircle2, Clock, MapPin, Sparkles } from "lucide-react-native";
import { PrimaryButton, SecondaryButton } from "../components/Buttons";
import { useApp } from "../context/AppContext";

// Direct port of OrderConfirmationScreen.tsx
export default function OrderConfirmationScreen() {
  const navigation = useRouter();
  const { activeTrackingOrder: order } = useApp();

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center p-8 bg-[#F7F4EE]">
        <CheckCircle2
          width={48}
          height={48}
          color="#059669"
          style={{ marginBottom: 12 }}
        />
        <Text className="text-base font-extrabold text-[#2D1810]">
          Order Placed!
        </Text>
        <Text className="text-xs text-[#8E7668] mb-4">
          Your order has been transmitted to our kitchen.
        </Text>
        <PrimaryButton onPress={() => navigation.push("/")}>
          Back to Home
        </PrimaryButton>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-[#F7F4EE] items-center px-4 py-6"
      style={{ gap: 20 }}
    >
      {/* CELEBRATION BADGE */}
      <View className="relative mt-4">
        <View className="w-20 h-20 rounded-full bg-emerald-500/15 items-center justify-center">
          <CheckCircle2 width={40} height={40} color="#059669" />
        </View>
        <View className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-[#E86A17] items-center justify-center">
          <Sparkles width={16} height={16} color="#fff" />
        </View>
      </View>

      <View className="items-center">
        <Text className="text-[11px] font-black uppercase tracking-widest text-[#E86A17]">
          Order Confirmed!
        </Text>
        <Text className="text-xl font-extrabold text-[#2D1810] mt-0.5 text-center">
          Thank you, {order.deliveryAddress?.label || "Faruk"}!
        </Text>
        <Text className="text-xs text-[#8E7668] mt-1 max-w-[260px] text-center">
          Our master chefs have received your order and are preparing your
          feast.
        </Text>
      </View>

      {/* ORDER SUMMARY CARD */}
      <View className="w-full bg-white rounded-3xl p-4 border border-[#613D2D]/12 gap-3">
        <View className="flex-row items-center justify-between pb-2 border-b border-neutral-100">
          <View>
            <Text className="text-[10px] text-[#8E7668]">Order Reference</Text>
            <Text className="text-xs font-extrabold text-[#2D1810]">
              #{order.orderNumber}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-[10px] text-[#8E7668]">
              Estimated Arrival
            </Text>
            <View className="flex-row items-center gap-1">
              <Clock width={11} height={11} color="#E86A17" />
              <Text className="text-xs font-extrabold text-[#E86A17]">
                {order.estimatedDeliveryTime}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-start gap-2.5">
          <MapPin
            width={16}
            height={16}
            color="#E86A17"
            style={{ marginTop: 2 }}
          />
          <View className="flex-1">
            <Text className="text-xs font-bold text-[#2D1810]">
              Delivering to {order.deliveryAddress?.label || "Home"}:
            </Text>
            <Text className="text-xs text-[#8E7668]">
              {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
            </Text>
          </View>
        </View>

        <View className="pt-2 border-t border-neutral-100 flex-row items-center justify-between">
          <Text className="text-xs font-bold text-[#2D1810]">
            {order.items.length} Delicious Items
          </Text>
          <Text className="text-sm font-black text-[#E86A17]">
            ${order.total.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* ACTION BUTTONS */}
      <View className="w-full gap-2.5">
        <PrimaryButton
          size="lg"
          fullWidth
          onPress={() => navigation.replace("/ordertracking")}
          icon={<Clock width={16} height={16} color="#fff" />}
        >
          Track Live Order Status
        </PrimaryButton>

        <SecondaryButton fullWidth onPress={() => navigation.push("/")}>
          Back to Kitchen Home
        </SecondaryButton>
      </View>
    </View>
  );
}
