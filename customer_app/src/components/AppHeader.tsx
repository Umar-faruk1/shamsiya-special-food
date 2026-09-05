import React from "react";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronDown,
  Bell,
  ShoppingBag,
  ArrowLeft,
  Heart,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { UserAddress } from "../types";

interface AppHeaderProps {
  currentScreen?: string;
  title?: string;
  subtitle?: string;
  cartCount?: number;
  unreadCount?: number;
  favoritesCount?: number;
  currentAddress?: UserAddress | null;
  currentLocation?: string;
  onAddressClick?: () => void;
  showBack?: boolean;
  onBack?: () => void;
  onOpenCart?: () => void;
  onOpenNotifications?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentScreen = "Home",
  title,
  subtitle,
  cartCount = 0,
  unreadCount = 0,
  favoritesCount = 0,
  currentAddress,
  currentLocation,
  onAddressClick,
  showBack = false,
  onBack,
  onOpenCart,
  onOpenNotifications,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isMainTab = ["Home", "Explore", "Orders", "Profile"].includes(
    currentScreen,
  );

  const handleBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  const handleCartClick = () => {
    if (onOpenCart) return onOpenCart();
    router.push("/cart");
  };

  const handleNotificationsClick = () => {
    if (onOpenNotifications) return onOpenNotifications();
    router.push("/notifications");
  };

  return (
    <View
      className="w-full bg-[#FDFBF7]/95 border-b border-[#613D2D]/10 px-4 pb-2.5"
      style={{ paddingTop: insets.top + 10 }}
    >
      <View className="flex-row items-center justify-between gap-2">
        {/* LEFT SECTION */}
        {showBack || !isMainTab ? (
          <View className="flex-row items-center gap-2 flex-1">
            <Pressable
              onPress={handleBack}
              className="w-9 h-9 rounded-full bg-[#F4EFE6] border border-[#613D2D]/15 items-center justify-center active:opacity-70"
              accessibilityLabel="Go Back"
            >
              <ArrowLeft
                width={16}
                height={16}
                color="#2D1810"
                strokeWidth={2.5}
              />
            </Pressable>
            <View>
              <Text className="text-base font-extrabold text-[#2D1810] leading-tight">
                {title || "Shamsiya"}
              </Text>
              {subtitle ? (
                <Text className="text-[11px] font-medium text-[#8E7668]">
                  {subtitle}
                </Text>
              ) : null}
            </View>
          </View>
        ) : (
          <View className="flex-col flex-1 min-w-0">
            <Text className="text-[10px] font-semibold text-[#8E7668]">
              Deliver to
            </Text>
            <Pressable
              onPress={onAddressClick || (() => router.push("/addresses"))}
              className="flex-row items-center gap-1 active:opacity-70"
              accessibilityLabel="Change delivery address"
            >
              <Text
                numberOfLines={1}
                className="text-sm font-extrabold text-[#2D1810] max-w-[190px]"
              >
                {currentAddress?.street || currentLocation || "Accra, Ghana"}
              </Text>
              <ChevronDown width={16} height={16} color="#8E7668" />
            </Pressable>
          </View>
        )}

        {/* RIGHT ACTION BUTTONS */}
        <View className="flex-row items-center gap-1.5">
          {/* Favorites shortcut */}
          <Pressable
            onPress={() => router.push("/favorites")}
            className={`w-8 h-8 rounded-full items-center justify-center active:opacity-70 ${
              currentScreen === "Favorites" ? "bg-[#E86A17]" : "bg-[#F4EFE6]"
            }`}
            accessibilityLabel="View Favorites"
          >
            <Heart
              width={16}
              height={16}
              color={favoritesCount > 0 ? "#EF4444" : "#2D1810"}
              fill={favoritesCount > 0 ? "#EF4444" : "none"}
            />
          </Pressable>

          {/* Notifications button */}
          <Pressable
            onPress={handleNotificationsClick}
            className={`relative w-8 h-8 rounded-full items-center justify-center active:opacity-70 ${
              currentScreen === "Notifications"
                ? "bg-[#E86A17]"
                : "bg-[#F4EFE6]"
            }`}
            accessibilityLabel="View Notifications"
          >
            <Bell width={16} height={16} color="#2D1810" />
            {unreadCount > 0 ? (
              <View className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-[#E86A17] border-2 border-[#FDFBF7]" />
            ) : null}
          </Pressable>

          {/* Cart button */}
          <Pressable
            onPress={handleCartClick}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2D1810] active:opacity-80"
            accessibilityLabel={`Cart with ${cartCount} items`}
          >
            <ShoppingBag width={14} height={14} color="#F59E0B" />
            <Text className="text-xs font-extrabold text-white">
              {cartCount}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};
