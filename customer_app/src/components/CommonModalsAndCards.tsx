import React from "react";
import { View, Text, Pressable, Modal } from "react-native";
import {
  MapPin,
  CheckCircle2,
  CreditCard,
  Wallet,
  Coins,
  Smartphone,
  Bell,
  X,
  AlertTriangle,
  Sparkles,
} from "lucide-react-native";
import { UserAddress, PaymentMethod, AppNotification } from "../types";

// Direct port of CommonModalsAndCards.tsx
export const AddressCard: React.FC<{
  address: UserAddress;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
}> = ({ address, isSelected = false, onSelect }) => {
  return (
    <Pressable
      onPress={onSelect}
      className={`flex-row items-start gap-3 p-3.5 rounded-3xl border ${
        isSelected ? "bg-[#FDFBF7] border-[#E86A17]" : "bg-white border-[#613D2D]/12"
      }`}
    >
      <View
        className={`w-9 h-9 rounded-2xl items-center justify-center ${
          isSelected ? "bg-[#E86A17]" : "bg-[#F4EFE6]"
        }`}
      >
        <MapPin width={16} height={16} color={isSelected ? "#fff" : "#2D1810"} />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-xs font-extrabold text-[#2D1810]">
            {address.label}
          </Text>
          {address.isDefault ? (
            <View className="px-1.5 py-0.5 rounded-md bg-[#2D1810]">
              <Text className="text-[9px] font-bold text-white">Default</Text>
            </View>
          ) : null}
        </View>
        <Text numberOfLines={1} className="text-xs text-[#2D1810] font-medium mt-0.5">
          {address.street}
        </Text>
        {address.apartment ? (
          <Text numberOfLines={1} className="text-[11px] text-[#8E7668]">
            {address.apartment}
          </Text>
        ) : null}
        <Text className="text-[10px] text-neutral-400">
          {address.city}, {address.postalCode} • {address.phone}
        </Text>
      </View>

      {isSelected ? <CheckCircle2 width={20} height={20} color="#E86A17" /> : null}
    </Pressable>
  );
};

export const PaymentMethodCard: React.FC<{
  payment: PaymentMethod;
  isSelected?: boolean;
  onSelect?: () => void;
}> = ({ payment, isSelected = false, onSelect }) => {
  const iconColor = isSelected ? "#fff" : "#2D1810";
  const Icon =
    payment.type === "card"
      ? CreditCard
      : payment.type === "apple_pay" || payment.type === "google_pay"
      ? Smartphone
      : payment.type === "mobile_money"
      ? Wallet
      : payment.type === "cash"
      ? Coins
      : CreditCard;

  return (
    <Pressable
      onPress={onSelect}
      className={`flex-row items-center justify-between p-3.5 rounded-3xl border ${
        isSelected ? "bg-[#FDFBF7] border-[#E86A17]" : "bg-white border-[#613D2D]/12"
      }`}
    >
      <View className="flex-row items-center gap-3 flex-1">
        <View
          className={`w-9 h-9 rounded-2xl items-center justify-center ${
            isSelected ? "bg-[#2D1810]" : "bg-[#F4EFE6]"
          }`}
        >
          <Icon width={16} height={16} color={iconColor} />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text numberOfLines={1} className="text-xs font-bold text-[#2D1810]">
              {payment.title}
            </Text>
            {payment.isDefault ? (
              <View className="px-1.5 py-0.5 rounded-md bg-amber-100">
                <Text className="text-[9px] font-bold text-amber-900">Default</Text>
              </View>
            ) : null}
          </View>
          {payment.last4 ? (
            <Text className="text-[11px] text-[#8E7668]">
              Ending in •••• {payment.last4} ({payment.expiry})
            </Text>
          ) : null}
          {payment.subtitle ? (
            <Text className="text-[11px] text-[#8E7668]">{payment.subtitle}</Text>
          ) : null}
        </View>
      </View>

      {isSelected ? <CheckCircle2 width={20} height={20} color="#E86A17" /> : null}
    </Pressable>
  );
};

export const NotificationItem: React.FC<{
  notification: AppNotification;
  onPress?: () => void;
}> = ({ notification, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-start gap-3 p-3.5 rounded-3xl border ${
        !notification.read ? "bg-[#FDFBF7] border-[#E86A17]/40" : "bg-white border-[#613D2D]/10"
      }`}
    >
      <View
        className={`w-8 h-8 rounded-2xl items-center justify-center ${
          notification.type === "ai"
            ? "bg-[#E86A17]"
            : notification.type === "order"
            ? "bg-emerald-600"
            : "bg-[#2D1810]"
        }`}
      >
        {notification.type === "ai" ? (
          <Sparkles width={16} height={16} color="#fff" />
        ) : (
          <Bell width={16} height={16} color="#fff" />
        )}
      </View>

      <View className="flex-1">
        <View className="flex-row items-center justify-between gap-1">
          <Text numberOfLines={1} className="text-xs font-bold text-[#2D1810] flex-1">
            {notification.title}
          </Text>
          <Text className="text-[10px] text-neutral-400 font-medium">
            {notification.time}
          </Text>
        </View>
        <Text className="text-xs text-[#613D2D] leading-relaxed mt-0.5">
          {notification.message}
        </Text>
      </View>
    </Pressable>
  );
};

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}> = ({ icon, title, description, actionText, onAction }) => {
  return (
    <View className="items-center p-8 bg-white rounded-3xl border border-[#613D2D]/10 w-full my-4">
      <View className="w-16 h-16 rounded-full bg-[#F4EFE6] items-center justify-center mb-3">
        {icon || <Sparkles width={32} height={32} color="#E86A17" />}
      </View>
      <Text className="text-sm font-extrabold text-[#2D1810] mb-1">{title}</Text>
      <Text className="text-xs text-[#8E7668] text-center max-w-[240px] leading-relaxed mb-4">
        {description}
      </Text>
      {actionText && onAction ? (
        <Pressable
          onPress={onAction}
          className="px-4 py-2 rounded-xl bg-[#2D1810] active:opacity-90"
        >
          <Text className="text-xs font-bold text-white">{actionText}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

export const LoadingSkeleton: React.FC<{ count?: number }> = ({ count = 2 }) => {
  return (
    <View className="gap-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          className="h-24 bg-neutral-200/70 rounded-3xl w-full border border-neutral-100"
        />
      ))}
    </View>
  );
};

export const ErrorState: React.FC<{
  message?: string;
  onRetry?: () => void;
}> = ({ message = "Something went wrong while loading data.", onRetry }) => {
  return (
    <View className="items-center p-6 bg-red-50 rounded-3xl border border-red-200 w-full my-3">
      <AlertTriangle width={32} height={32} color="#EF4444" style={{ marginBottom: 8 }} />
      <Text className="text-xs font-semibold text-red-800 mb-3 text-center">
        {message}
      </Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          className="px-3.5 py-1.5 rounded-xl bg-red-600 active:opacity-90"
        >
          <Text className="text-xs font-bold text-white">Try Again</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

export const BottomSheet: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/60">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full bg-[#FDFBF7] rounded-t-[32px] border border-[#613D2D]/15 overflow-hidden"
          style={{ maxHeight: "90%" }}
        >
          <View className="items-center pt-2.5 pb-1">
            <View className="w-12 h-1.5 rounded-full bg-neutral-300" />
          </View>

          {title ? (
            <View className="flex-row items-center justify-between px-5 py-2 border-b border-[#613D2D]/10">
              <Text className="text-sm font-extrabold text-[#2D1810]">{title}</Text>
              <Pressable
                onPress={onClose}
                className="w-7 h-7 rounded-full bg-[#F4EFE6] items-center justify-center"
                accessibilityLabel="Close modal"
              >
                <X width={16} height={16} color="#2D1810" />
              </Pressable>
            </View>
          ) : null}

          <View className="p-4">{children}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
