import React from "react";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, Compass, ReceiptText, User } from "lucide-react-native";
import { useRouter, usePathname } from "expo-router";
import { FloatingCameraButton } from "./FloatingCameraButton";
import { useApp } from "../context/AppContext";

const ACTIVE = "#2D1810";
const INACTIVE = "#8E7668";
const ACCENT = "#E86A17";

export function BottomTabBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { orders } = useApp();

  const activeOrderCount = orders.filter(
    (o) => o.status !== "delivered" && o.status !== "cancelled",
  ).length;

  const TabButton = ({
    label,
    icon: Icon,
    path,
    badge,
  }: {
    label: string;
    icon: any;
    path: string;
    badge?: number;
  }) => {
    // Check if current route matches path (handles root '/' for Home)
    const isActive =
      path === "/"
        ? pathname === "/" || pathname === "/index"
        : pathname.startsWith(path);

    return (
      <Pressable
        onPress={() => router.push(path as any)}
        className="flex-1 items-center justify-center py-1.5"
        accessibilityLabel={label}
      >
        <View>
          <Icon
            width={20}
            height={20}
            color={isActive ? ACTIVE : INACTIVE}
            strokeWidth={isActive ? 2.5 : 1.8}
          />
          {badge && badge > 0 ? (
            <View className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#E86A17] items-center justify-center">
              <Text className="text-[10px] font-extrabold text-white">
                {badge}
              </Text>
            </View>
          ) : null}
          {isActive ? (
            <View
              className="absolute -bottom-1 self-center w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: ACCENT, left: "50%", marginLeft: -3 }}
            />
          ) : null}
        </View>
        <Text
          className="text-[11px] mt-1"
          style={{
            color: isActive ? ACTIVE : INACTIVE,
            fontWeight: isActive ? "700" : "500",
          }}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      className="w-full bg-[#FDFBF7] border-t border-[#613D2D]/10"
      style={{
        paddingBottom: Math.max(insets.bottom, 6),
        boxShadow: "0px -4px 24px rgba(45, 24, 16, 0.06)",
      }}
    >
      <View className="flex-row items-center justify-between px-3 py-1.5">
        <TabButton label="Home" icon={Home} path="/" />
        <TabButton label="Explore" icon={Compass} path="/(tabs)/explore" />

        <View className="flex-1 items-center justify-center">
          <FloatingCameraButton
            isActive={pathname.startsWith("/food-scanner")}
            onPress={() => router.push("/food-scanner")}
          />
        </View>

        <TabButton
          label="Orders"
          icon={ReceiptText}
          path="/(tabs)/orders"
          badge={activeOrderCount}
        />
        <TabButton label="Profile" icon={User} path="/(tabs)/profile" />
      </View>
    </View>
  );
}
