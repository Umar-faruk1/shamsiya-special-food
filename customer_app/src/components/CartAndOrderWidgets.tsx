import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import { Trash2, Phone, MessageSquare, Star, ChevronRight, CheckCircle2, Clock } from "lucide-react-native";
import { CartItem as CartItemType, Order, RiderInfo, OrderStatusStep } from "../types";
import { QuantitySelector, StatusBadge } from "./BadgesAndRatings";

// Direct port of CartAndOrderWidgets.tsx
export const CartItemRow: React.FC<{
  item: CartItemType;
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
  onRemove: (cartItemId: string) => void;
}> = ({ item, onUpdateQuantity, onRemove }) => {
  return (
    <View className="flex-row gap-3 bg-white p-3 rounded-3xl border border-[#613D2D]/10">
      <Image
        source={{ uri: item.food.image }}
        style={{ width: 80, height: 80, borderRadius: 16 }}
      />

      <View className="flex-1 justify-between">
        <View className="flex-row items-start justify-between gap-1">
          <View className="flex-1">
            <Text numberOfLines={1} className="text-xs font-bold text-[#2D1810]">
              {item.food.name}
            </Text>
            {item.options.size ? (
              <Text className="text-[10px] text-[#8E7668]">
                Size: {item.options.size}
              </Text>
            ) : null}
            {item.options.spiceLevel ? (
              <Text className="text-[10px] text-[#8E7668]">
                Spice: {item.options.spiceLevel}
              </Text>
            ) : null}
            {item.options.addons.length > 0 ? (
              <Text numberOfLines={1} className="text-[10px] text-amber-700 font-medium">
                + {item.options.addons.map((a) => a.name).join(", ")}
              </Text>
            ) : null}
          </View>

          <Pressable
            onPress={() => onRemove(item.cartItemId)}
            className="p-1"
            accessibilityLabel="Remove item"
          >
            <Trash2 width={14} height={14} color="#A3A3A3" />
          </Pressable>
        </View>

        <View className="flex-row items-center justify-between pt-1 border-t border-neutral-100 mt-1">
          <Text className="text-xs font-extrabold text-[#2D1810]">
            ${item.itemTotalPrice.toFixed(2)}
          </Text>

          <QuantitySelector
            size="sm"
            quantity={item.quantity}
            onIncrease={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
            onDecrease={() => {
              if (item.quantity > 1) {
                onUpdateQuantity(item.cartItemId, item.quantity - 1);
              } else {
                onRemove(item.cartItemId);
              }
            }}
          />
        </View>
      </View>
    </View>
  );
};

export const OrderCard: React.FC<{
  order: Order;
  onViewDetails: (order: Order) => void;
  onTrackOrder?: (order: Order) => void;
  onReorder?: (order: Order) => void;
}> = ({ order, onViewDetails, onTrackOrder, onReorder }) => {
  const isOngoing = order.status !== "delivered" && order.status !== "cancelled";

  return (
    <View className="bg-white rounded-3xl p-4 border border-[#613D2D]/12 gap-3">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-[10px] font-bold text-[#8E7668]">
            Order #{order.orderNumber}
          </Text>
          <Text className="text-xs font-medium text-neutral-500">{order.createdAt}</Text>
        </View>
        <StatusBadge status={order.status} />
      </View>

      <View className="flex-row items-center gap-3 py-1 border-t border-b border-neutral-100">
        <View className="flex-row">
          {order.items.slice(0, 3).map((it, idx) => (
            <Image
              key={idx}
              source={{ uri: it.food.image }}
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: "#fff",
                marginLeft: idx > 0 ? -12 : 0,
              }}
            />
          ))}
        </View>
        <View className="flex-1">
          <Text numberOfLines={1} className="text-xs font-bold text-[#2D1810]">
            {order.items.map((it) => `${it.quantity}x ${it.food.name}`).join(", ")}
          </Text>
          <Text className="text-[11px] text-[#8E7668]">
            Total: <Text className="font-bold text-[#2D1810]">${order.total.toFixed(2)}</Text> (
            {order.items.length} items)
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between gap-2">
        <Pressable onPress={() => onViewDetails(order)} className="flex-row items-center gap-1">
          <Text className="text-xs font-bold text-[#613D2D]">View Receipt</Text>
          <ChevronRight width={14} height={14} color="#613D2D" />
        </Pressable>

        {isOngoing ? (
          <Pressable
            onPress={() => onTrackOrder?.(order)}
            className="px-3.5 py-1.5 rounded-xl bg-[#E86A17] flex-row items-center gap-1.5"
          >
            <Clock width={14} height={14} color="#fff" />
            <Text className="text-white text-xs font-bold">Live Tracking</Text>
          </Pressable>
        ) : onReorder ? (
          <Pressable
            onPress={() => onReorder(order)}
            className="px-3.5 py-1.5 rounded-xl bg-[#F4EFE6]"
          >
            <Text className="text-[#2D1810] text-xs font-bold">Reorder</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

export const OrderTimeline: React.FC<{ steps: OrderStatusStep[] }> = ({ steps }) => {
  return (
    <View className="gap-4 py-2">
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        return (
          <View key={idx} className="flex-row gap-3 items-start relative">
            {!isLast ? (
              <View
                className={`absolute left-3.5 top-7 bottom-[-16px] w-0.5 ${
                  step.completed ? "bg-emerald-500" : "bg-neutral-200"
                }`}
              />
            ) : null}

            <View
              className={`w-7 h-7 rounded-full items-center justify-center ${
                step.completed
                  ? "bg-emerald-500"
                  : step.current
                  ? "bg-[#E86A17]"
                  : "bg-neutral-200"
              }`}
            >
              {step.completed ? (
                <CheckCircle2 width={16} height={16} color="#fff" />
              ) : (
                <View className="w-2 h-2 rounded-full bg-white" />
              )}
            </View>

            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text
                  className={`text-xs font-extrabold ${
                    step.current
                      ? "text-[#E86A17]"
                      : step.completed
                      ? "text-[#2D1810]"
                      : "text-neutral-400"
                  }`}
                >
                  {step.label}
                </Text>
                <Text className="text-[10px] text-neutral-400 font-medium">
                  {step.timestamp}
                </Text>
              </View>
              <Text className="text-[11px] text-[#8E7668] leading-tight mt-0.5">
                {step.description}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

export const RiderCard: React.FC<{
  rider: RiderInfo;
  onCall?: () => void;
  onMessage?: () => void;
}> = ({ rider, onCall, onMessage }) => {
  return (
    <View className="flex-row items-center justify-between bg-white p-3.5 rounded-3xl border border-[#613D2D]/12 w-full">
      <View className="flex-row items-center gap-3 flex-1">
        <View className="relative">
          <Image
            source={{ uri: rider.avatar }}
            style={{ width: 48, height: 48, borderRadius: 16 }}
          />
          <View className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white items-center justify-center">
            <Text className="text-white text-[8px] font-bold">✓</Text>
          </View>
        </View>

        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text numberOfLines={1} className="text-xs font-bold text-[#2D1810]">
              {rider.name}
            </Text>
            <View className="flex-row items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-50">
              <Star width={10} height={10} color="#F59E0B" fill="#F59E0B" />
              <Text className="text-[10px] font-bold text-amber-700">{rider.rating}</Text>
            </View>
          </View>

          <Text numberOfLines={1} className="text-[10px] text-[#8E7668]">
            {rider.vehicle} • {rider.plateNumber}
          </Text>
          <Text numberOfLines={1} className="text-[10px] text-emerald-700 font-medium">
            {rider.currentLocationName}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-1.5">
        <Pressable
          onPress={onMessage}
          className="w-9 h-9 rounded-2xl bg-[#F4EFE6] items-center justify-center"
          accessibilityLabel="Message Rider"
        >
          <MessageSquare width={16} height={16} color="#2D1810" />
        </Pressable>
        <Pressable
          onPress={onCall}
          className="w-9 h-9 rounded-2xl bg-emerald-600 items-center justify-center"
          accessibilityLabel="Call Rider"
        >
          <Phone width={16} height={16} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
};
