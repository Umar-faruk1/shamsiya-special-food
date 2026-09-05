import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  TextInput,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Ticket,
  Check,
  Plus,
} from "lucide-react-native";
import { CartItemRow } from "../components/CartAndOrderWidgets";
import { PrimaryButton } from "../components/Buttons";
import { EmptyState } from "../components/CommonModalsAndCards";
import { AppHeader } from "../components/AppHeader";
import { useApp } from "../context/AppContext";

// Direct port of CartScreen.tsx
export default function CartScreen() {
  const navigation = useRouter();
  const {
    cartItems,
    handleUpdateQuantity,
    handleRemoveCartItem,
    handleClearCart,
    foodItems,
    handleAddToCartQuick,
  } = useApp();

  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    amount: number;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const subtotal = cartItems.reduce((acc, it) => acc + it.itemTotalPrice, 0);
  const deliveryFee = subtotal > 40 ? 0 : 3.99;
  const serviceFee = Number((subtotal * 0.05).toFixed(2));
  const discountAmount = appliedDiscount ? appliedDiscount.amount : 0;
  const total = Math.max(
    0,
    subtotal + deliveryFee + serviceFee - discountAmount,
  );

  const upsellItems = useMemo(
    () =>
      foodItems
        .filter(
          (f) =>
            (f.category === "desserts" || f.category === "drinks") &&
            !cartItems.some((ci) => ci.food.id === f.id),
        )
        .slice(0, 2),
    [foodItems, cartItems],
  );

  const handleApplyPromo = () => {
    setPromoError(null);
    const clean = promoCode.trim().toUpperCase();
    if (clean === "SHAMSIYA20" || clean === "AI20") {
      setAppliedDiscount({
        code: clean,
        amount: Number((subtotal * 0.2).toFixed(2)),
      });
    } else if (clean === "FEAST10") {
      setAppliedDiscount({ code: clean, amount: 10.0 });
    } else {
      setPromoError("Invalid code. Try 'SHAMSIYA20' for 20% off!");
    }
  };

  if (cartItems.length === 0) {
    return (
      <View className="flex-1 bg-[#F7F4EE]">
        <AppHeader currentScreen="Cart" title="Your Cart" showBack />
        <View className="flex-1 items-center justify-center px-4">
          <EmptyState
            icon={<ShoppingBag width={40} height={40} color="#E86A17" />}
            title="Your Feast Basket is Empty"
            description="Explore our authentic aromatic recipes and add your favorites to get started."
            actionText="Discover Delicious Foods"
            onAction={() => navigation.push("/explore")}
          />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader currentScreen="Cart" title="Your Cart" showBack />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: 32,
          gap: 20,
        }}
      >
        {/* CART ITEMS LIST */}
        <View className="gap-2.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-extrabold text-[#2D1810]">
              Order Items ({cartItems.reduce((a, b) => a + b.quantity, 0)})
            </Text>
            <Pressable onPress={handleClearCart}>
              <Text className="text-xs text-neutral-400 font-semibold">
                Clear All
              </Text>
            </Pressable>
          </View>

          <View className="gap-2.5">
            {cartItems.map((item) => (
              <CartItemRow
                key={item.cartItemId}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemoveCartItem}
              />
            ))}
          </View>
        </View>

        {/* AI UPSELL PAIRINGS */}
        {upsellItems.length > 0 ? (
          <View className="gap-2.5 bg-[#FDFBF7] p-3.5 rounded-3xl border border-[#613D2D]/12">
            <View className="flex-row items-center gap-1.5">
              <Sparkles width={14} height={14} color="#E86A17" />
              <Text className="text-xs font-extrabold text-[#2D1810]">
                AI Chef's Recommended Pairings
              </Text>
            </View>

            <View className="gap-2">
              {upsellItems.map((food) => (
                <View
                  key={food.id}
                  className="flex-row items-center justify-between bg-white p-2.5 rounded-2xl border border-[#613D2D]/10"
                >
                  <View className="flex-row items-center gap-2.5 flex-1">
                    <Image
                      source={{ uri: food.image }}
                      style={{ width: 40, height: 40, borderRadius: 12 }}
                    />
                    <View className="flex-1">
                      <Text
                        numberOfLines={1}
                        className="text-xs font-bold text-[#2D1810]"
                      >
                        {food.name}
                      </Text>
                      <Text className="text-[10px] text-[#8E7668]">
                        ${food.price.toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => handleAddToCartQuick(food)}
                    className="px-2.5 py-1 rounded-xl bg-[#F4EFE6] flex-row items-center gap-1"
                  >
                    <Plus width={12} height={12} color="#2D1810" />
                    <Text className="text-[11px] font-bold text-[#2D1810]">
                      Add
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* PROMO CODE */}
        <View className="gap-2 bg-white p-3.5 rounded-3xl border border-[#613D2D]/12">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1">
              <Ticket width={14} height={14} color="#E86A17" />
              <Text className="text-xs font-extrabold text-[#2D1810]">
                Promo Voucher
              </Text>
            </View>
            <Text className="text-[10px] text-[#8E7668]">
              Use code: <Text className="font-bold">SHAMSIYA20</Text>
            </Text>
          </View>

          {appliedDiscount ? (
            <View className="flex-row items-center justify-between p-2 rounded-2xl bg-emerald-50 border border-emerald-200">
              <View className="flex-row items-center gap-2">
                <Check width={16} height={16} color="#059669" />
                <Text className="text-xs font-bold text-emerald-800">
                  {appliedDiscount.code} applied (-$
                  {appliedDiscount.amount.toFixed(2)})
                </Text>
              </View>
              <Pressable onPress={() => setAppliedDiscount(null)}>
                <Text className="text-xs text-neutral-400">Remove</Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-row gap-2">
              <TextInput
                value={promoCode}
                onChangeText={(t) => setPromoCode(t.toUpperCase())}
                placeholder="Enter voucher code"
                placeholderTextColor="rgba(142,118,104,0.6)"
                autoCapitalize="characters"
                className="flex-1 uppercase font-bold text-xs px-3 py-2 bg-[#FDFBF7] border border-[#613D2D]/15 rounded-2xl text-[#2D1810]"
              />
              <Pressable
                onPress={handleApplyPromo}
                className="px-4 py-2 rounded-2xl bg-[#2D1810] justify-center"
              >
                <Text className="text-white text-xs font-bold">Apply</Text>
              </Pressable>
            </View>
          )}

          {promoError ? (
            <Text className="text-[10px] text-red-600 font-semibold">
              {promoError}
            </Text>
          ) : null}
        </View>

        {/* BILL SUMMARY */}
        <View className="gap-2.5 bg-white p-4 rounded-3xl border border-[#613D2D]/12">
          <Text className="text-xs font-extrabold text-[#2D1810] uppercase tracking-wider">
            Payment Breakdown
          </Text>

          <View className="flex-row justify-between">
            <Text className="text-xs text-[#613D2D]">Subtotal</Text>
            <Text className="text-xs font-bold text-[#2D1810]">
              ${subtotal.toFixed(2)}
            </Text>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-xs text-[#613D2D]">Delivery Fee</Text>
            {deliveryFee === 0 ? (
              <Text className="text-xs font-bold text-emerald-600">
                FREE ($40+ Order)
              </Text>
            ) : (
              <Text className="text-xs font-bold text-[#2D1810]">
                ${deliveryFee.toFixed(2)}
              </Text>
            )}
          </View>

          <View className="flex-row justify-between">
            <Text className="text-xs text-[#613D2D]">Service & Processing</Text>
            <Text className="text-xs font-bold text-[#2D1810]">
              ${serviceFee.toFixed(2)}
            </Text>
          </View>

          {appliedDiscount ? (
            <View className="flex-row justify-between">
              <Text className="text-xs font-bold text-emerald-700">
                Voucher Discount
              </Text>
              <Text className="text-xs font-bold text-emerald-700">
                -${discountAmount.toFixed(2)}
              </Text>
            </View>
          ) : null}

          <View className="pt-2 border-t border-neutral-100 flex-row justify-between items-baseline">
            <Text className="text-sm font-black text-[#2D1810]">
              Total Amount
            </Text>
            <Text className="text-lg font-black text-[#E86A17]">
              ${total.toFixed(2)}
            </Text>
          </View>
        </View>

        <PrimaryButton
          size="lg"
          fullWidth
          onPress={() =>
            navigation.push({
              pathname: "/checkout",
              params: {
                subtotal: String(subtotal),
                deliveryFee: String(deliveryFee),
                serviceFee: String(serviceFee),
                discountAmount: String(discountAmount),
                total: String(total),
                promoCode: appliedDiscount?.code,
              },
            })
          }
          icon={
            <ArrowRight width={16} height={16} color="#fff" strokeWidth={2.5} />
          }
        >
          Proceed to Checkout (${total.toFixed(2)})
        </PrimaryButton>
      </ScrollView>
    </View>
  );
}
