import React from "react";
import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Camera, Sparkles } from "lucide-react-native";

interface FloatingCameraButtonProps {
  onPress: () => void;
  isActive?: boolean;
}

// Port of FloatingCameraButton.tsx. Web's radial glow + gradient button
// becomes an expo-linear-gradient circle with a soft shadow.
export const FloatingCameraButton: React.FC<FloatingCameraButtonProps> = ({
  onPress,
  isActive = false,
}) => {
  return (
    <View className="-top-5 items-center">
      <Pressable
        onPress={onPress}
        accessibilityLabel="Scan food using camera"
        style={{
          boxShadow: "0px 8px 12px rgba(232, 106, 23, 0.38)",
          elevation: 8,
        }}
        className={`w-16 h-16 rounded-full items-center justify-center border-2 ${
          isActive ? "border-[#2D1810]" : "border-white/80"
        }`}
      >
        <LinearGradient
          colors={["#FFA028", "#E86A17", "#D97706"]}
          style={{ position: "absolute", width: "100%", height: "100%", borderRadius: 999 }}
        />
        <View className="absolute top-1 right-2">
          <Sparkles width={12} height={12} color="#FDE68A" />
        </View>
        <Camera width={28} height={28} color="#2D1810" strokeWidth={2.3} />
        <Text className="text-[9px] font-extrabold text-[#2D1810] uppercase mt-0.5">
          AI Scan
        </Text>
      </Pressable>
      <Text className="mt-1 text-[11px] font-bold text-[#2D1810] text-center">
        Scan Food
      </Text>
    </View>
  );
};
