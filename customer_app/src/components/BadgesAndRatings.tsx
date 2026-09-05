import React from "react";
import { View, Text, Pressable } from "react-native";
import { Star, Minus, Plus } from "lucide-react-native";
import { OrderStatus } from "../types";

const starSizePx = { sm: 14, md: 16, lg: 20 };
const textSizeClass = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base font-semibold",
};

// Direct port of BadgesAndRatings.tsx
export const RatingStars: React.FC<{
  rating: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
}> = ({ rating, count, size = "sm", showNumber = true }) => {
  const px = starSizePx[size];

  return (
    <View className="flex-row items-center gap-1.5">
      <View className="flex-row items-center">
        {[1, 2, 3, 4, 5].map((index) => {
          const filled = rating >= index;
          const half = rating >= index - 0.5 && rating < index;
          return (
            <Star
              key={index}
              width={px}
              height={px}
              color={filled || half ? "#F59E0B" : "#D4D4D4"}
              fill={filled ? "#F59E0B" : half ? "#F59E0B80" : "none"}
            />
          );
        })}
      </View>
      {showNumber ? (
        <Text className={`${textSizeClass[size]} font-bold text-[#2D1810]`}>
          {rating.toFixed(1)}
        </Text>
      ) : null}
      {count !== undefined ? (
        <Text className={`${textSizeClass[size]} text-neutral-500 font-normal`}>
          ({count})
        </Text>
      ) : null}
    </View>
  );
};

export const QuantitySelector: React.FC<{
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
}> = ({ quantity, onIncrease, onDecrease, min = 1, max = 99, size = "md" }) => {
  const isSm = size === "sm";
  const btnSize = isSm ? 24 : 32;
  const iconSize = isSm ? 12 : 16;

  return (
    <View
      className={`flex-row items-center bg-[#F4EFE6] border border-[#613D2D]/15 rounded-xl ${
        isSm ? "px-1 py-0.5" : "px-2 py-1"
      }`}
    >
      <Pressable
        onPress={onDecrease}
        disabled={quantity <= min}
        style={{ width: btnSize, height: btnSize, opacity: quantity <= min ? 0.3 : 1 }}
        className="items-center justify-center rounded-lg active:bg-white"
        accessibilityLabel="Decrease quantity"
      >
        <Minus width={iconSize} height={iconSize} color="#2D1810" />
      </Pressable>

      <Text
        className={`font-bold text-[#2D1810] text-center ${
          isSm ? "w-7 text-xs" : "w-9 text-sm"
        }`}
      >
        {quantity}
      </Text>

      <Pressable
        onPress={onIncrease}
        disabled={quantity >= max}
        style={{ width: btnSize, height: btnSize, opacity: quantity >= max ? 0.3 : 1 }}
        className="items-center justify-center rounded-lg active:bg-white"
        accessibilityLabel="Increase quantity"
      >
        <Plus width={iconSize} height={iconSize} color="#2D1810" />
      </Pressable>
    </View>
  );
};

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  placed: { label: "Order Placed", bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
  confirmed: { label: "Confirmed", bg: "#EEF2FF", text: "#4338CA", dot: "#6366F1" },
  preparing: { label: "Cooking in Kitchen", bg: "#FFFBEB", text: "#B45309", dot: "#F59E0B" },
  ready: { label: "Ready for Pickup", bg: "#FAF5FF", text: "#7E22CE", dot: "#A855F7" },
  picked_up: { label: "Picked Up", bg: "#FFF7ED", text: "#C2410C", dot: "#F97316" },
  on_the_way: { label: "Rider on the Way", bg: "#ECFDF5", text: "#065F46", dot: "#10B981" },
  delivered: { label: "Delivered", bg: "#F0FDF4", text: "#15803D", dot: "#16A34A" },
  cancelled: { label: "Cancelled", bg: "#FEF2F2", text: "#B91C1C", dot: "#EF4444" },
};

export const StatusBadge: React.FC<{ status: OrderStatus | string }> = ({
  status,
}) => {
  const item = statusConfig[status] || {
    label: status,
    bg: "#F5F5F5",
    text: "#404040",
    dot: "#A3A3A3",
  };

  return (
    <View
      className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full self-start"
      style={{ backgroundColor: item.bg }}
    >
      <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.dot }} />
      <Text className="text-xs font-semibold" style={{ color: item.text }}>
        {item.label}
      </Text>
    </View>
  );
};
