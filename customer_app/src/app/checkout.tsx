import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  CheckCircle2,
  CreditCard,
  MapPin,
  Plus,
  Wallet,
} from "lucide-react-native";
import { AppHeader } from "../components/AppHeader";
import { PrimaryButton, SecondaryButton } from "../components/Buttons";
import { EmptyState } from "../components/CommonModalsAndCards";
import { useApp } from "../context/AppContext";
import { supabase } from "../api/supabase";

type CustomerAddress = {
  id: string;
  label: string;
  address: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  delivery_instructions: string | null;
  is_default: boolean;
};

type PaymentMethodValue = "cash" | "mobile_money" | "card";

const paymentMethods: { value: PaymentMethodValue; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "card", label: "Card" },
];

const emptyAddressForm = {
  label: "Home",
  address: "",
  city: "",
  latitude: "",
  longitude: "",
  delivery_instructions: "",
  is_default: false,
};

function formatCurrency(value: number) {
  return `₵${value.toFixed(2)}`;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { cartItems, authUser, handleClearCart } = useApp();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodValue>("cash");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAddresses = useCallback(async () => {
    if (!authUser) {
      setIsLoadingAddresses(false);
      return;
    }
    setIsLoadingAddresses(true);
    setAddressError(null);
    const { data, error } = await supabase
      .from("addresses")
      .select(
        "id,label,address,city,latitude,longitude,delivery_instructions,is_default",
      )
      .eq("user_id", authUser.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Unable to load customer addresses:", error);
      setAddressError("We could not load your saved addresses.");
    } else {
      const nextAddresses = (data ?? []) as CustomerAddress[];
      setAddresses(nextAddresses);
      setSelectedAddressId((current) =>
        nextAddresses.some((address) => address.id === current)
          ? current
          : (nextAddresses[0]?.id ?? ""),
      );
    }
    setIsLoadingAddresses(false);
  }, [authUser]);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  const subtotal = useMemo(
    () => cartItems.reduce((total, item) => total + item.itemTotalPrice, 0),
    [cartItems],
  );
  const deliveryFee = 0;
  const discount = 0;
  const total = Number((subtotal + deliveryFee - discount).toFixed(2));
  const selectedAddress = addresses.find(
    (address) => address.id === selectedAddressId,
  );

  const updateAddressForm = (
    field: keyof typeof emptyAddressForm,
    value: string | boolean,
  ) => {
    setAddressForm((current) => ({ ...current, [field]: value }));
  };

  const handleSaveAddress = async () => {
    if (!authUser) {
      Alert.alert(
        "Sign in required",
        "Please sign in before adding an address.",
      );
      return;
    }
    if (!addressForm.label.trim() || !addressForm.address.trim()) {
      Alert.alert(
        "Address details missing",
        "Add a label and delivery address.",
      );
      return;
    }
    const latitude = addressForm.latitude.trim()
      ? Number(addressForm.latitude)
      : null;
    const longitude = addressForm.longitude.trim()
      ? Number(addressForm.longitude)
      : null;
    if (
      (latitude !== null && !Number.isFinite(latitude)) ||
      (longitude !== null && !Number.isFinite(longitude))
    ) {
      Alert.alert(
        "Invalid location",
        "Latitude and longitude must be valid numbers.",
      );
      return;
    }
    setIsSavingAddress(true);
    try {
      const { data: insertedAddress, error } = await supabase
        .from("addresses")
        .insert({
          user_id: authUser.id,
          label: addressForm.label.trim(),
          address: addressForm.address.trim(),
          city: addressForm.city.trim() || null,
          latitude,
          longitude,
          delivery_instructions:
            addressForm.delivery_instructions.trim() || null,
          is_default: addressForm.is_default,
        })
        .select("id")
        .single();
      if (error) throw error;
      if (addressForm.is_default && insertedAddress) {
        const { error: resetError } = await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", authUser.id)
          .neq("id", insertedAddress.id);
        if (resetError) throw resetError;
      }
      setAddressForm(emptyAddressForm);
      setShowAddressForm(false);
      await loadAddresses();
    } catch (error) {
      console.error("Unable to save customer address:", error);
      Alert.alert(
        "Could not save address",
        "Please check the details and try again.",
      );
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (isSubmitting) return;
    if (!authUser) {
      Alert.alert(
        "Sign in required",
        "Please sign in before placing an order.",
      );
      return;
    }
    if (!cartItems.length) {
      Alert.alert("Cart is empty", "Add an item before placing your order.");
      return;
    }
    if (!selectedAddress) {
      Alert.alert("Address required", "Select a delivery address first.");
      return;
    }
    if (
      !Number.isFinite(subtotal) ||
      subtotal < 0 ||
      !Number.isFinite(total) ||
      total < 0
    ) {
      Alert.alert("Invalid total", "We could not calculate your order total.");
      return;
    }
    const items = cartItems.map((item) => ({
      menu_item_id: item.food.id,
      name: item.food.name,
      quantity: item.quantity,
      unit_price: Number((item.itemTotalPrice / item.quantity).toFixed(2)),
      total_price: Number(item.itemTotalPrice.toFixed(2)),
      selected_options: item.options.selectedOptions ?? [],
      notes: item.options.specialInstructions || null,
    }));
    if (
      items.some(
        (item) =>
          item.quantity <= 0 ||
          !Number.isFinite(item.unit_price) ||
          !Number.isFinite(item.total_price),
      )
    ) {
      Alert.alert(
        "Invalid cart item",
        "One of your cart items is no longer valid.",
      );
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("create_customer_order", {
        p_address_id: selectedAddress.id,
        p_delivery_address: selectedAddress.address,
        p_delivery_latitude: selectedAddress.latitude,
        p_delivery_longitude: selectedAddress.longitude,
        p_customer_note: deliveryInstructions.trim() || null,
        p_payment_method: paymentMethod,
        p_subtotal: subtotal,
        p_delivery_fee: deliveryFee,
        p_discount: discount,
        p_items: items,
      });
      if (error) throw error;
      const result = data as {
        order_id?: string;
        order_number?: string;
        total?: number | string;
        payment_method?: PaymentMethodValue;
        status?: string;
      };
      if (
        !result?.order_id ||
        !result.order_number ||
        !Number.isFinite(Number(result.total))
      )
        throw new Error("The order response was incomplete.");
      handleClearCart();
      router.replace({
        pathname: "/order-confirmation",
        params: {
          orderId: result.order_id,
          orderNumber: result.order_number,
          total: String(result.total),
          paymentMethod: result.payment_method || paymentMethod,
          status: result.status || "pending",
        },
      });
    } catch (error) {
      console.error("Unable to create customer order:", error);
      Alert.alert(
        "Order could not be placed",
        "Please try again. Your cart is still saved.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1">
              <MapPin width={14} height={14} color="#E86A17" />
              <Text className="text-xs font-extrabold text-[#2D1810] uppercase tracking-wider">
                Delivery Address
              </Text>
            </View>
            <Pressable
              onPress={() => setShowAddressForm((current) => !current)}
              className="flex-row items-center gap-1"
            >
              <Plus width={14} height={14} color="#E86A17" />
              <Text className="text-xs text-[#E86A17] font-bold">
                Add New Address
              </Text>
            </Pressable>
          </View>
          {showAddressForm ? (
            <View className="gap-2 bg-white p-4 rounded-3xl border border-[#613D2D]/12">
              {(
                [
                  ["label", "Label", "Home"],
                  ["address", "Address", "Street and house number"],
                  ["city", "City", "City"],
                  ["latitude", "Latitude", "Optional"],
                  ["longitude", "Longitude", "Optional"],
                  [
                    "delivery_instructions",
                    "Delivery instructions",
                    "Optional",
                  ],
                ] as const
              ).map(([field, label, placeholder]) => (
                <View key={field} className="gap-1">
                  <Text className="text-[11px] font-bold text-[#613D2D]">
                    {label}
                  </Text>
                  <TextInput
                    value={addressForm[field] as string}
                    onChangeText={(value) => updateAddressForm(field, value)}
                    placeholder={placeholder}
                    placeholderTextColor="#A9998F"
                    className="rounded-xl border border-[#613D2D]/15 bg-[#FDFBF7] px-3 py-2.5 text-xs text-[#2D1810]"
                    keyboardType={
                      field === "latitude" || field === "longitude"
                        ? "decimal-pad"
                        : "default"
                    }
                  />
                </View>
              ))}
              <Pressable
                onPress={() =>
                  updateAddressForm("is_default", !addressForm.is_default)
                }
                className="flex-row items-center gap-2 py-1"
              >
                <CheckCircle2
                  width={18}
                  height={18}
                  color={addressForm.is_default ? "#E86A17" : "#A9998F"}
                />
                <Text className="text-xs text-[#2D1810]">
                  Make this my default address
                </Text>
              </Pressable>
              <View className="flex-row gap-2">
                <SecondaryButton
                  fullWidth
                  onPress={() => setShowAddressForm(false)}
                >
                  Cancel
                </SecondaryButton>
                <PrimaryButton
                  fullWidth
                  loading={isSavingAddress}
                  onPress={() => void handleSaveAddress()}
                >
                  Save Address
                </PrimaryButton>
              </View>
            </View>
          ) : null}
          {isLoadingAddresses ? <ActivityIndicator color="#E86A17" /> : null}
          {addressError ? (
            <View className="gap-2 bg-red-50 p-4 rounded-2xl">
              <Text className="text-xs text-red-800">{addressError}</Text>
              <Pressable onPress={() => void loadAddresses()}>
                <Text className="text-xs font-bold text-red-700">
                  Try again
                </Text>
              </Pressable>
            </View>
          ) : null}
          {!isLoadingAddresses && !addresses.length && !addressError ? (
            <EmptyState
              icon={<MapPin width={32} height={32} color="#E86A17" />}
              title="No saved addresses"
              description="Add a delivery address before placing your order."
              actionText="Add New Address"
              onAction={() => setShowAddressForm(true)}
            />
          ) : null}
          <View className="gap-2">
            {addresses.map((address) => (
              <Pressable
                key={address.id}
                onPress={() => setSelectedAddressId(address.id)}
                className={`flex-row items-start gap-3 p-3.5 rounded-3xl border ${selectedAddressId === address.id ? "bg-[#FDFBF7] border-[#E86A17]" : "bg-white border-[#613D2D]/12"}`}
              >
                <View
                  className={`w-9 h-9 rounded-2xl items-center justify-center ${selectedAddressId === address.id ? "bg-[#E86A17]" : "bg-[#F4EFE6]"}`}
                >
                  <MapPin
                    width={16}
                    height={16}
                    color={
                      selectedAddressId === address.id ? "#fff" : "#2D1810"
                    }
                  />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xs font-extrabold text-[#2D1810]">
                      {address.label}
                    </Text>
                    {address.is_default ? (
                      <Text className="rounded-md bg-[#2D1810] px-1.5 py-0.5 text-[9px] font-bold text-white">
                        Default
                      </Text>
                    ) : null}
                  </View>
                  <Text className="mt-0.5 text-xs font-medium text-[#2D1810]">
                    {address.address}
                  </Text>
                  {address.city ? (
                    <Text className="text-[11px] text-[#8E7668]">
                      {address.city}
                    </Text>
                  ) : null}
                </View>
                {selectedAddressId === address.id ? (
                  <CheckCircle2 width={20} height={20} color="#E86A17" />
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>
        <View className="gap-2 bg-white p-4 rounded-3xl border border-[#613D2D]/12">
          <Text className="text-xs font-extrabold text-[#2D1810] uppercase tracking-wider">
            Delivery Instructions
          </Text>
          <TextInput
            value={deliveryInstructions}
            onChangeText={setDeliveryInstructions}
            placeholder="Optional instructions for the rider"
            placeholderTextColor="#A9998F"
            multiline
            className="min-h-20 rounded-xl border border-[#613D2D]/15 bg-[#FDFBF7] px-3 py-2.5 text-xs text-[#2D1810]"
          />
        </View>
        <View className="gap-2">
          <View className="flex-row items-center gap-1">
            <CreditCard width={14} height={14} color="#E86A17" />
            <Text className="text-xs font-extrabold text-[#2D1810] uppercase tracking-wider">
              Payment Method
            </Text>
          </View>
          {paymentMethods.map((method) => (
            <Pressable
              key={method.value}
              onPress={() => setPaymentMethod(method.value)}
              className={`flex-row items-center gap-3 p-3.5 rounded-3xl border ${paymentMethod === method.value ? "bg-[#FDFBF7] border-[#E86A17]" : "bg-white border-[#613D2D]/12"}`}
            >
              <View
                className={`w-9 h-9 rounded-2xl items-center justify-center ${paymentMethod === method.value ? "bg-[#2D1810]" : "bg-[#F4EFE6]"}`}
              >
                <Wallet
                  width={16}
                  height={16}
                  color={paymentMethod === method.value ? "#fff" : "#2D1810"}
                />
              </View>
              <Text className="flex-1 text-xs font-bold text-[#2D1810]">
                {method.label}
              </Text>
              {paymentMethod === method.value ? (
                <CheckCircle2 width={20} height={20} color="#E86A17" />
              ) : null}
            </Pressable>
          ))}
        </View>
        <View className="gap-2 bg-white p-4 rounded-3xl border border-[#613D2D]/12">
          <Text className="text-xs font-extrabold text-[#2D1810] uppercase tracking-wider">
            Order Summary
          </Text>
          {cartItems.map((item) => (
            <View
              key={item.cartItemId}
              className="gap-0.5 border-b border-neutral-100 pb-2"
            >
              <View className="flex-row justify-between">
                <Text className="flex-1 text-xs font-bold text-[#2D1810]">
                  {item.food.name} x{item.quantity}
                </Text>
                <Text className="text-xs font-bold text-[#2D1810]">
                  {formatCurrency(item.itemTotalPrice)}
                </Text>
              </View>
              {item.options.selectedOptions?.length ? (
                <Text className="text-[10px] text-[#8E7668]">
                  {item.options.selectedOptions
                    .map((option) => option.name)
                    .join(", ")}
                </Text>
              ) : null}
              <Text className="text-[10px] text-[#8E7668]">
                {formatCurrency(item.itemTotalPrice / item.quantity)} each
              </Text>
            </View>
          ))}
          <View className="flex-row justify-between">
            <Text className="text-xs text-[#613D2D]">Subtotal</Text>
            <Text className="text-xs font-bold text-[#2D1810]">
              {formatCurrency(subtotal)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-[#613D2D]">Delivery fee</Text>
            <Text className="text-xs font-bold text-[#2D1810]">
              {formatCurrency(deliveryFee)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-[#613D2D]">Discount</Text>
            <Text className="text-xs font-bold text-[#2D1810]">
              -{formatCurrency(discount)}
            </Text>
          </View>
          <View className="flex-row justify-between border-t border-neutral-100 pt-2">
            <Text className="text-sm font-black text-[#2D1810]">Total</Text>
            <Text className="text-xl font-black text-[#E86A17]">
              {formatCurrency(total)}
            </Text>
          </View>
        </View>
        <PrimaryButton
          size="lg"
          fullWidth
          loading={isSubmitting}
          disabled={!selectedAddress || !cartItems.length}
          onPress={() => void handlePlaceOrder()}
        >
          Place Order • {formatCurrency(total)}
        </PrimaryButton>
      </ScrollView>
    </View>
  );
}
