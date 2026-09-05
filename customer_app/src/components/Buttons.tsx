import React from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  PressableProps,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface ButtonProps extends Omit<PressableProps, "children"> {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
}

const sizePadding = {
  sm: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  md: { paddingHorizontal: 20, paddingVertical: 11, borderRadius: 16 },
  lg: { paddingHorizontal: 24, paddingVertical: 15, borderRadius: 16 },
};

const sizeTextClass = {
  sm: "text-xs font-medium",
  md: "text-sm font-semibold",
  lg: "text-base font-bold",
};

// Port of Buttons.tsx (PrimaryButton = gradient CTA, SecondaryButton = outline)
export const PrimaryButton: React.FC<ButtonProps> = ({
  children,
  size = "md",
  fullWidth = false,
  icon,
  loading = false,
  disabled,
  style,
  onPress,
  ...props
}) => {
  return (
    <Pressable
      {...props}
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        {
          opacity: disabled ? 0.5 : pressed ? 0.95 : 1,
          width: fullWidth ? "100%" : undefined,
          boxShadow: "0px 4px 8px rgba(232, 106, 23, 0.25)",
        },
        typeof style === "function" ? undefined : style,
      ]}
    >
      <LinearGradient
        colors={["#E86A17", "#D97706"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          },
          sizePadding[size],
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          icon && <View>{icon}</View>
        )}
        <Text className={`text-white ${sizeTextClass[size]}`}>{children}</Text>
      </LinearGradient>
    </Pressable>
  );
};

export const SecondaryButton: React.FC<ButtonProps> = ({
  children,
  size = "md",
  fullWidth = false,
  icon,
  loading = false,
  disabled,
  style,
  onPress,
  ...props
}) => {
  return (
    <Pressable
      {...props}
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: fullWidth ? "100%" : undefined,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          borderWidth: 1,
          borderColor: "rgba(97,61,45,0.2)",
          backgroundColor: "#FDFBF7",
        },
        sizePadding[size],
        typeof style === "function" ? undefined : style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#2D1810" />
      ) : (
        icon && <View>{icon}</View>
      )}
      <Text className={`text-[#2D1810] ${sizeTextClass[size]}`}>
        {children}
      </Text>
    </Pressable>
  );
};
