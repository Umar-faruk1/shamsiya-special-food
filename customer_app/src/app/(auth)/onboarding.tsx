import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react-native";
import { useRouter } from "expo-router";
import { PrimaryButton, SecondaryButton } from "../../components/Buttons";

const steps = [
  {
    id: "step-1",
    title: "Discover Delicious Food",
    description: "Explore your favorite meals from Shamsiya Special Food.",
    image:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=900&auto=format&fit=crop&q=80",
    badge: "Curated Recipes",
    highlight: "Over 40+ authentic clay-pot feasts and chef specialties",
  },
  {
    id: "step-2",
    title: "Order With Ease",
    description:
      "Choose your favorite meals, customize your order, and checkout in seconds.",
    image:
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=900&auto=format&fit=crop&q=80",
    badge: "Seamless Customization",
    highlight: "Custom spice levels, aromatic sides, and one-tap reordering",
  },
  {
    id: "step-3",
    title: "Track Your Delivery",
    description: "Follow your order from preparation to your doorstep.",
    image:
      "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=900&auto=format&fit=crop&q=80",
    badge: "Real-Time Tracking",
    highlight: "Live GPS courier updates and instant kitchen status",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const { width } = useWindowDimensions();

  const onFinish = () => router.replace("/(auth)/login");
  const onSkip = () => router.replace("/(auth)/login");

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onFinish();
    }
  };

  const step = steps[currentStep];
  const heroHeight = ((width - 40) * 3) / 4;

  return (
    <View className="flex-1 justify-between p-5 bg-[#FDFBF7]">
      {/* Top Header: Skip button */}
      <View className="flex-row items-center justify-between pt-1">
        <View className="flex-row items-center gap-1.5">
          <View className="w-2 h-2 rounded-full bg-[#E86A17]" />
          <Text className="text-xs font-black text-[#2D1810]">
            Shamsiya Special Food
          </Text>
        </View>

        <Pressable
          onPress={onSkip}
          className="px-3 py-1.5 rounded-full active:bg-[#F4EFE6]"
        >
          <Text className="text-xs font-bold text-[#8E7668]">Skip</Text>
        </Pressable>
      </View>

      {/* Hero Visual Card */}
      <View
        className="relative my-4 w-full rounded-3xl overflow-hidden border border-[#613D2D]/10 bg-neutral-900"
        style={{ height: heroHeight }}
      >
        <Image
          source={{ uri: step.image }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />

        <LinearGradient
          colors={["rgba(0,0,0,0.75)", "rgba(0,0,0,0.2)", "transparent"]}
          style={{ position: "absolute", inset: 0 }}
        />

        {/* Floating pill badge */}
        <View className="absolute top-3 left-3 flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/15">
          <Sparkles width={12} height={12} color="#E86A17" />
          <Text className="text-[11px] font-black text-amber-300">
            {step.badge}
          </Text>
        </View>

        {/* Bottom image caption */}
        <View className="absolute bottom-3 left-3 right-3">
          <Text
            numberOfLines={1}
            className="text-[11px] font-semibold text-neutral-200"
          >
            {step.highlight}
          </Text>
        </View>
      </View>

      {/* Text Info Section */}
      <View className="items-center px-2 gap-2">
        {/* Page Indicators */}
        <View className="flex-row items-center justify-center gap-2 mb-2">
          {steps.map((_, idx) => (
            <Pressable
              key={idx}
              onPress={() => setCurrentStep(idx)}
              className={`h-2 rounded-full ${
                currentStep === idx ? "w-7 bg-[#E86A17]" : "w-2 bg-[#613D2D]/20"
              }`}
              accessibilityLabel={`Go to slide ${idx + 1}`}
            />
          ))}
        </View>

        <Text className="text-2xl font-black text-[#2D1810] text-center">
          {step.title}
        </Text>

        <Text className="text-xs text-[#613D2D] text-center max-w-[280px] leading-relaxed">
          {step.description}
        </Text>
      </View>

      {/* Bottom Actions */}
      <View className="gap-2 pt-4">
        {currentStep === steps.length - 1 ? (
          <View className="gap-2">
            <PrimaryButton
              fullWidth
              size="lg"
              onPress={onFinish}
              icon={
                <ArrowRight
                  width={16}
                  height={16}
                  color="#fff"
                  strokeWidth={2.5}
                />
              }
            >
              Get Started
            </PrimaryButton>
            <SecondaryButton fullWidth size="md" onPress={onSkip}>
              Skip
            </SecondaryButton>
          </View>
        ) : (
          <PrimaryButton
            fullWidth
            size="lg"
            onPress={handleNext}
            icon={
              <ChevronRight
                width={16}
                height={16}
                color="#fff"
                strokeWidth={2.5}
              />
            }
          >
            Next
          </PrimaryButton>
        )}
      </View>
    </View>
  );
}
