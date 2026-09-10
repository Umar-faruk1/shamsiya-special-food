import React from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { ShoppingBag } from "lucide-react-native";
import { useRouter } from "expo-router";
import { CartItemRow } from "../components/CartAndOrderWidgets";
import { PrimaryButton } from "../components/Buttons";
import { EmptyState } from "../components/CommonModalsAndCards";
import { AppHeader } from "../components/AppHeader";
import { useApp } from "../context/AppContext";

export default function CartScreen() {
  const router = useRouter();
  const {
    cartItems,
    cartTotalItems,
    handleUpdateQuantity,
    handleRemoveCartItem,
  } = useApp();

  const subtotal = cartItems.reduce(
    (total, item) => total + item.itemTotalPrice,
    0,
  );

  if (cartItems.length === 0) {
    return (
      <View className="flex-1 bg-[#F7F4EE]">
        <AppHeader currentScreen="Cart" title="Your Cart" showBack />
        <View className="flex-1 items-center justify-center px-4">
          <EmptyState
            icon={<ShoppingBag width={40} height={40} color="#E86A17" />}
            title="Your cart is empty"
            description="Browse the menu and add something delicious."
            actionText="Browse Menu"
            onAction={() => router.push("/explore")}
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
        <View className="gap-2.5">
          <Text className="text-sm font-extrabold text-[#2D1810]">
            Cart Items ({cartTotalItems})
          </Text>
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

        <View className="gap-3 bg-white p-4 rounded-3xl border border-[#613D2D]/12">
          <Text className="text-xs font-extrabold text-[#2D1810] uppercase tracking-wider">
            Cart Summary
          </Text>
          <View className="flex-row justify-between">
            <Text className="text-xs text-[#613D2D]">Total items</Text>
            <Text className="text-xs font-bold text-[#2D1810]">
              {cartTotalItems}
            </Text>
          </View>
          <View className="pt-2 border-t border-neutral-100 flex-row justify-between items-baseline">
            <Text className="text-sm font-black text-[#2D1810]">Subtotal</Text>
            <Text className="text-lg font-black text-[#E86A17]">
              ₵{subtotal.toFixed(2)}
            </Text>
          </View>
        </View>

        <PrimaryButton
          size="lg"
          fullWidth
          onPress={() =>
            Alert.alert(
              "Checkout coming soon",
              "Your local cart is ready. Checkout will be added in the next step.",
            )
          }
        >
          Proceed to Checkout
        </PrimaryButton>
      </ScrollView>
    </View>
  );
}
