import React, { useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import {
  MapPin,
  Clock,
  CreditCard,
  Heart,
  ShieldCheck,
  Lock,
} from "lucide-react-native";
import {
  AddressCard,
  PaymentMethodCard,
} from "../components/CommonModalsAndCards";
import { PrimaryButton } from "../components/Buttons";
import { AppHeader } from "../components/AppHeader";
import { useApp } from "../context/AppContext";

const tipOptions = [0, 2, 3, 5, 8];

// Direct port of CheckoutScreen.tsx
export default function CheckoutScreen() {
  const navigation = useRouter();
  const { cartItems, user, handlePlaceOrder } = useApp();
  const addresses = user.savedAddresses;
  const paymentMethods = user.savedPaymentMethods;

  const [selectedAddressId, setSelectedAddressId] = useState(
    addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || "",
  );
  const [selectedPaymentId, setSelectedPaymentId] = useState(
    paymentMethods.find((p) => p.isDefault)?.id || paymentMethods[0]?.id || "",
  );
  const [selectedTip, setSelectedTip] = useState<number>(3.0);
  const [deliveryOption, setDeliveryOption] = useState<"instant" | "scheduled">(
    "instant",
  );
  const [driverNotes, setDriverNotes] = useState(
    "Leave at front door & ring bell please",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = cartItems.reduce((acc, it) => acc + it.itemTotalPrice, 0);
  const deliveryFee = subtotal > 40 ? 0 : 3.99;
  const serviceFee = Number((subtotal * 0.05).toFixed(2));
  const total = Number(
    (subtotal + deliveryFee + serviceFee + selectedTip).toFixed(2),
  );

  const selectedAddress =
    addresses.find((a) => a.id === selectedAddressId) || addresses[0];
  const selectedPayment =
    paymentMethods.find((p) => p.id === selectedPaymentId) || paymentMethods[0];

  const handleConfirmOrder = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      handlePlaceOrder(
        {
          items: cartItems,
          subtotal,
          deliveryFee,
          tax: serviceFee,
          tip: selectedTip,
          total,
          deliveryAddress: selectedAddress,
          paymentMethod: selectedPayment,
          estimatedDeliveryTime: "25 - 35 mins",
          deliveryNotes: driverNotes,
        },
        () => {
          setIsSubmitting(false);
          navigation.replace("/order-confirmation");
        },
      );
    }, 900);
  };

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader currentScreen="Checkout" title="Checkout" showBack />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: 32,
          gap: 20,
        }}
      >
        {/* 1. DELIVERY ADDRESS */}
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1">
              <MapPin width={14} height={14} color="#E86A17" />
              <Text className="text-xs font-extrabold text-[#2D1810] uppercase tracking-wider">
                Delivery Address
              </Text>
            </View>
            <Pressable onPress={() => navigation.push("/addresses")}>
              <Text className="text-xs text-[#E86A17] font-bold">Manage</Text>
            </Pressable>
          </View>

          <View className="gap-2">
            {addresses.map((addr) => (
              <AddressCard
                key={addr.id}
                address={addr}
                isSelected={selectedAddressId === addr.id}
                onSelect={() => setSelectedAddressId(addr.id)}
              />
            ))}
          </View>
        </View>

        {/* 2. DELIVERY TIMING */}
        <View className="gap-2 bg-white p-3.5 rounded-3xl border border-[#613D2D]/12">
          <View className="flex-row items-center gap-1">
            <Clock width={14} height={14} color="#E86A17" />
            <Text className="text-xs font-extrabold text-[#2D1810] uppercase tracking-wider">
              Delivery Schedule
            </Text>
          </View>

          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setDeliveryOption("instant")}
              className={`flex-1 p-3 rounded-2xl border ${
                deliveryOption === "instant"
                  ? "bg-[#2D1810] border-[#E86A17]"
                  : "bg-[#FDFBF7] border-neutral-200"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  deliveryOption === "instant" ? "text-white" : "text-[#2D1810]"
                }`}
              >
                ⚡ Priority Instant
              </Text>
              <Text
                className={`text-[10px] ${
                  deliveryOption === "instant"
                    ? "text-amber-300"
                    : "text-[#8E7668]"
                }`}
              >
                Estimated 25–35 mins
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setDeliveryOption("scheduled")}
              className={`flex-1 p-3 rounded-2xl border ${
                deliveryOption === "scheduled"
                  ? "bg-[#2D1810] border-[#E86A17]"
                  : "bg-[#FDFBF7] border-neutral-200"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  deliveryOption === "scheduled"
                    ? "text-white"
                    : "text-[#2D1810]"
                }`}
              >
                📅 Schedule Order
              </Text>
              <Text
                className={`text-[10px] ${
                  deliveryOption === "scheduled"
                    ? "text-amber-300"
                    : "text-[#8E7668]"
                }`}
              >
                Set evening time slot
              </Text>
            </Pressable>
          </View>

          <View className="mt-1">
            <Text className="text-[11px] font-bold text-[#8E7668] mb-1">
              Rider Delivery Notes:
            </Text>
            <TextInput
              value={driverNotes}
              onChangeText={setDriverNotes}
              placeholder="e.g. Ring apartment bell #402 or call upon arrival"
              placeholderTextColor="rgba(142,118,104,0.6)"
              className="w-full text-xs px-3 py-2 rounded-xl bg-[#FDFBF7] border border-[#613D2D]/15 text-[#2D1810]"
            />
          </View>
        </View>

        {/* 3. PAYMENT METHOD */}
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1">
              <CreditCard width={14} height={14} color="#E86A17" />
              <Text className="text-xs font-extrabold text-[#2D1810] uppercase tracking-wider">
                Payment Method
              </Text>
            </View>
            <Pressable onPress={() => navigation.push("/payment-methods")}>
              <Text className="text-xs text-[#E86A17] font-bold">Add New</Text>
            </Pressable>
          </View>

          <View className="gap-2">
            {paymentMethods.map((pm) => (
              <PaymentMethodCard
                key={pm.id}
                payment={pm}
                isSelected={selectedPaymentId === pm.id}
                onSelect={() => setSelectedPaymentId(pm.id)}
              />
            ))}
          </View>
        </View>

        {/* 4. RIDER TIP */}
        <View className="gap-2 bg-white p-3.5 rounded-3xl border border-[#613D2D]/12">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1">
              <Heart width={14} height={14} color="#E86A17" fill="#E86A17" />
              <Text className="text-xs font-extrabold text-[#2D1810]">
                Rider Appreciation Tip
              </Text>
            </View>
            <Text className="text-[10px] text-[#8E7668]">
              100% goes to driver
            </Text>
          </View>

          <View className="flex-row gap-2">
            {tipOptions.map((tip) => (
              <Pressable
                key={tip}
                onPress={() => setSelectedTip(tip)}
                className={`flex-1 py-2 rounded-xl items-center ${
                  selectedTip === tip ? "bg-[#E86A17]" : "bg-[#F4EFE6]"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    selectedTip === tip ? "text-white" : "text-[#2D1810]"
                  }`}
                >
                  {tip === 0 ? "No tip" : `$${tip}`}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 5. FINAL BILL */}
        <View className="gap-2 bg-white p-4 rounded-3xl border border-[#613D2D]/12">
          <Text className="text-xs font-extrabold text-[#2D1810] uppercase tracking-wider">
            Final Cost Summary
          </Text>
          <View className="flex-row justify-between">
            <Text className="text-xs text-[#613D2D]">
              Food Subtotal ({cartItems.length} items)
            </Text>
            <Text className="text-xs font-bold text-[#2D1810]">
              ${subtotal.toFixed(2)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-[#613D2D]">Delivery Fee</Text>
            <Text className="text-xs font-bold text-[#2D1810]">
              ${deliveryFee.toFixed(2)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-[#613D2D]">Service Fee</Text>
            <Text className="text-xs font-bold text-[#2D1810]">
              ${serviceFee.toFixed(2)}
            </Text>
          </View>
          {selectedTip > 0 ? (
            <View className="flex-row justify-between">
              <Text className="text-xs text-[#613D2D]">Rider Tip</Text>
              <Text className="text-xs font-bold text-[#2D1810]">
                ${selectedTip.toFixed(2)}
              </Text>
            </View>
          ) : null}
          <View className="pt-2 border-t border-neutral-100 flex-row justify-between items-baseline">
            <Text className="text-sm font-black text-[#2D1810]">
              Total Payable
            </Text>
            <Text className="text-xl font-black text-[#E86A17]">
              ${total.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* 6. PLACE ORDER */}
        <PrimaryButton
          size="lg"
          fullWidth
          loading={isSubmitting}
          onPress={handleConfirmOrder}
          icon={<Lock width={16} height={16} color="#fff" />}
        >
          Place Order • ${total.toFixed(2)}
        </PrimaryButton>

        <View className="flex-row items-center justify-center gap-1">
          <ShieldCheck width={14} height={14} color="#059669" />
          <Text className="text-[10px] text-center text-[#8E7668]">
            Secured by Appwrite Cloud Backend & Encrypted Payment
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
