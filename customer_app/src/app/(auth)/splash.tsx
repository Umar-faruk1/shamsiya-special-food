import React, { useEffect, useRef, useState } from "react";
import { View, Text, ImageBackground, Animated, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles, UtensilsCrossed } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function SplashScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState(15);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => router.replace("/(auth)/onboarding"), 300);
          return 100;
        }
        return prev + 18;
      });
    }, 180);
    return () => clearInterval(timer);
  }, [router]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 700,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    ).start();
  }, [pulse]);

  return (
    <ImageBackground
      source={{
        uri: "https://images.unsplash.com/photo-1543353071-873f17a7a088?w=1200&auto=format&fit=crop&q=80",
      }}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <LinearGradient
        colors={["rgba(45,24,16,0.78)", "rgba(45,24,16,0.94)"]}
        style={{ flex: 1 }}
      >
        <View className="flex-1 items-center justify-between p-6">
          {/* Top spacer */}
          <View className="pt-6" />

          {/* Center Logo, Title, Tagline */}
          <View className="items-center max-w-xs">
            <View className="relative mb-6">
              <Animated.View
                style={{ transform: [{ scale: pulse }] }}
                className="w-24 h-24 rounded-3xl items-center justify-center"
              >
                <LinearGradient
                  colors={["#E86A17", "#FFA028", "#FFD066"]}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 24,
                    padding: 4,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View className="w-full h-full rounded-[18px] bg-[#2D1810] items-center justify-center border border-amber-300/30">
                    <Text className="text-3xl font-black tracking-tighter text-amber-300">
                      SF
                    </Text>
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <UtensilsCrossed width={14} height={14} color="#FCD34D" />
                      <Sparkles width={12} height={12} color="#E86A17" />
                    </View>
                  </View>
                </LinearGradient>
              </Animated.View>

              <View className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[#E86A17] items-center justify-center border-2 border-[#2D1810]">
                <Text className="text-white text-xs font-black">★</Text>
              </View>
            </View>

            <Text className="text-2xl font-black text-white mb-2 text-center">
              Shamsiya Special Food
            </Text>
            <Text className="text-sm font-semibold text-amber-200/90 text-center max-w-[220px]">
              Delicious food. Delivered to you.
            </Text>
          </View>

          {/* Bottom Loading Progress Animation */}
          <View className="w-full max-w-xs items-center gap-3 pb-8">
            <View className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden border border-white/10">
              <LinearGradient
                colors={["#E86A17", "#FFD066"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  borderRadius: 999,
                }}
              />
            </View>

            <View className="flex-row items-center gap-2">
              <View className="w-1.5 h-1.5 rounded-full bg-[#E86A17]" />
              <Text className="text-xs font-medium text-neutral-300">
                Preparing your kitchen feast...
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}
