import React from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AlertCircle, CheckCircle2 } from "lucide-react-native";
import { PrimaryButton, SecondaryButton } from "../components/Buttons";

// Direct port of OrderConfirmationScreen.tsx
export default function OrderConfirmationScreen() {
  const navigation = useRouter();
  const params = useLocalSearchParams<{
    orderId?: string;
    orderNumber?: string;
    total?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    paymentMessage?: string;
    status?: string;
  }>();
  const orderNumber =
    typeof params.orderNumber === "string" ? params.orderNumber : null;
  const total = typeof params.total === "string" ? Number(params.total) : NaN;
  const paymentMethod =
    typeof params.paymentMethod === "string" ? params.paymentMethod : "cash";
  const displayPaymentMethod =
    paymentMethod === "mobile_money"
      ? "Mobile Money"
      : paymentMethod === "card"
        ? "Card"
        : "Cash";
  const isPaymentProcessing =
    params.paymentStatus === "processing" ||
    params.paymentStatus === "pay_offline";

  if (orderNumber && Number.isFinite(total)) {
    return (
      <View
        className="flex-1 bg-[#F7F4EE] items-center px-4 py-10"
        style={{ gap: 20 }}
      >
        <View className="w-20 h-20 rounded-full bg-emerald-500/15 items-center justify-center">
          <CheckCircle2 width={40} height={40} color="#059669" />
        </View>
        <View className="items-center">
          <Text className="text-[11px] font-black uppercase tracking-widest text-[#E86A17]">
            Order Placed
          </Text>
          <Text className="text-xl font-extrabold text-[#2D1810] mt-1">
            Thank you for your order
          </Text>
          <Text className="text-xs text-[#8E7668] mt-1">
            Your order has been sent to the kitchen.
          </Text>
        </View>
        <View className="w-full bg-white rounded-3xl p-4 border border-[#613D2D]/12 gap-3">
          <View className="flex-row justify-between">
            <Text className="text-xs text-[#8E7668]">Order number</Text>
            <Text className="text-xs font-extrabold text-[#2D1810]">
              #{orderNumber}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-[#8E7668]">Total</Text>
            <Text className="text-sm font-black text-[#E86A17]">
              ₵{total.toFixed(2)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-[#8E7668]">Payment method</Text>
            <Text className="text-xs font-bold text-[#2D1810]">
              {displayPaymentMethod}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-[#8E7668]">Status</Text>
            <Text className="text-xs font-bold text-[#2D1810]">
              {isPaymentProcessing ? "Payment pending" : "Pending"}
            </Text>
          </View>
        </View>
        {isPaymentProcessing ? (
          <View className="w-full rounded-2xl bg-amber-50 p-4">
            <Text className="text-sm font-extrabold text-amber-900">
              Payment request sent
            </Text>
            <Text className="mt-1 text-xs leading-relaxed text-amber-800">
              {params.paymentMessage ||
                "Please approve the payment request on your phone. Your payment will be confirmed after Paystack verifies it."}
            </Text>
          </View>
        ) : null}
        {typeof params.orderId === "string" ? (
          <View className="w-full gap-2">
            <PrimaryButton
              size="lg"
              fullWidth
              onPress={() =>
                navigation.replace({
                  pathname: "/order-details",
                  params: { orderId: params.orderId },
                })
              }
            >
              View Order Details
            </PrimaryButton>
            <SecondaryButton
              fullWidth
              onPress={() =>
                navigation.replace({
                  pathname: "/ordertracking",
                  params: { orderId: params.orderId },
                })
              }
            >
              Track Order
            </SecondaryButton>
          </View>
        ) : null}
        <PrimaryButton
          size="lg"
          fullWidth
          onPress={() => navigation.replace("/")}
        >
          Back to Home
        </PrimaryButton>
      </View>
    );
  }

  if (!orderNumber || !Number.isFinite(total)) {
    return (
      <View className="flex-1 items-center justify-center p-8 bg-[#F7F4EE] gap-3">
        <AlertCircle width={42} height={42} color="#E86A17" />
        <Text className="text-base font-extrabold text-[#2D1810]">
          Unable to load your order.
        </Text>
        <Text className="text-xs text-center text-[#8E7668]">
          The order confirmation details are unavailable. Please return to your
          orders and try again.
        </Text>
        <SecondaryButton onPress={() => navigation.replace("/(tabs)/orders")}>
          View Orders
        </SecondaryButton>
      </View>
    );
  }
}
