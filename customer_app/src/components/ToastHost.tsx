import React, { useEffect, useRef } from "react";
import { Animated, Text, View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";

// Ported from the web app's toast (`toastMessage` shown via a fixed div with
// `.animate-slide-up`). Uses Animated instead of the CSS keyframe.
export function ToastHost() {
  const { toastMessage } = useApp();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toastMessage) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]).start();
    } else {
      translateY.setValue(60);
      opacity.setValue(0);
    }
  }, [toastMessage]);

  if (!toastMessage) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: insets.bottom + 84,
        alignItems: "center",
      }}
    >
      <Animated.View
        style={{
          transform: [{ translateY }],
          opacity,
          backgroundColor: "#2D1810",
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 999,
          maxWidth: "100%",
        }}
      >
        <Text style={{ color: "#F7F4EE", fontWeight: "600", fontSize: 14 }}>
          {toastMessage}
        </Text>
      </Animated.View>
    </View>
  );
}
