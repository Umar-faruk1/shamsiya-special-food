import React, { useState } from "react";
import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import {
  Camera,
  Sparkles,
  Search,
  RefreshCw,
  AlertTriangle,
  Star,
  ChevronRight,
  Plus,
  ShoppingBag,
  HelpCircle,
} from "lucide-react-native";
import { FoodItem } from "../types";
import { PrimaryButton, SecondaryButton } from "../components/Buttons";
import { AppHeader } from "../components/AppHeader";
import { useApp } from "../context/AppContext";

const candidateOptions = [
  { name: "Jollof Rice", confidence: 94 },
  { name: "Fried Rice", confidence: 61 },
  { name: "Waakye", confidence: 43 },
];

// Direct port of ScanResultsScreen.tsx
export default function ScanResultsScreen() {
  const navigation = useRouter();
  const {
    latestScanResult: scanResult,
    foodItems,
    handleAddToCartQuick,
  } = useApp();
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(
    null,
  );

  const matchingFoods = [
    {
      id: "shamsiya-special-jollof",
      name: "Shamsiya Special Jollof Rice",
      priceGhc: 25,
      rating: 4.8,
      reviewsCount: 312,
      description:
        "Fragrant woodsmoke jollof rice served with spiced sweet plantains (dodo) and tender seasoned chicken.",
      prepTime: "15-20 min",
      image:
        "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&auto=format&fit=crop&q=80",
      fallbackFood: foodItems[1] || foodItems[0],
    },
    {
      id: "chicken-jollof",
      name: "Chicken Jollof",
      priceGhc: 35,
      rating: 4.7,
      reviewsCount: 245,
      description:
        "Rich party jollof rice with flame-grilled spicy quarter chicken and sweet salad.",
      prepTime: "15-25 min",
      image:
        "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
      fallbackFood: foodItems[0] || foodItems[1],
    },
  ];

  const buildFoodItem = (foodOption: (typeof matchingFoods)[0]): FoodItem => ({
    ...foodOption.fallbackFood,
    name: foodOption.name,
    price: foodOption.priceGhc,
    description: foodOption.description,
    image: foodOption.image,
    rating: foodOption.rating,
  });

  const handleSelectMatchingFood = (foodOption: (typeof matchingFoods)[0]) => {
    const item = buildFoodItem(foodOption);
    navigation.push({
      pathname: "/food-details-modal",
      params: { foodId: item.id },
    });
  };

  const handleAddToCartDirect = (foodOption: (typeof matchingFoods)[0]) => {
    handleAddToCartQuick(buildFoodItem(foodOption));
  };

  if (!scanResult) {
    return (
      <View className="flex-1 bg-[#F7F4EE]">
        <AppHeader
          currentScreen="ScanResults"
          title="Food Recognition"
          showBack
        />
        <View className="flex-1 items-center justify-center p-8">
          <View className="w-16 h-16 rounded-3xl bg-[#E86A17]/15 items-center justify-center mb-4">
            <Camera width={32} height={32} color="#E86A17" />
          </View>
          <Text className="text-base font-extrabold text-[#2D1810]">
            No Scan Data Available
          </Text>
          <Text className="text-xs text-[#8E7668] mb-5 max-w-[240px] text-center">
            Point your camera at any food or choose an image from your gallery.
          </Text>
          <PrimaryButton onPress={() => navigation.push("/food-scanner")}>
            Open Camera
          </PrimaryButton>
        </View>
      </View>
    );
  }

  const activeDishName =
    selectedCandidate || scanResult.recognizedDishName || "Jollof Rice";
  const confidenceScore = scanResult.confidence ?? 94;
  const isHighConfidence = confidenceScore >= 75;
  const isMediumConfidence = confidenceScore >= 50 && confidenceScore < 75;
  const isLowConfidence = confidenceScore < 50;

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader
        currentScreen="ScanResults"
        title="Food Recognition"
        showBack
      />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: 40,
          gap: 20,
        }}
      >
        {/* CAPTURED IMAGE */}
        <View className="relative w-full aspect-[16/10] rounded-3xl overflow-hidden bg-neutral-900 border-2 border-[#613D2D]/15">
          <Image
            source={{ uri: scanResult.scannedImageUrl }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />

          <View className="absolute top-3 left-3 bg-black/65 px-3 py-1 rounded-full border border-white/20 flex-row items-center gap-1.5">
            <Camera width={12} height={12} color="#E86A17" />
            <Text className="text-white text-[10px] font-extrabold">
              Scanned Photo
            </Text>
          </View>

          <Pressable
            onPress={() => navigation.push("/food-scanner")}
            className="absolute top-3 right-3 bg-black/65 px-3 py-1 rounded-full border border-white/20 flex-row items-center gap-1"
          >
            <RefreshCw width={12} height={12} color="#FCD34D" />
            <Text className="text-white text-[10px] font-extrabold">
              Scan Again
            </Text>
          </Pressable>
        </View>

        {/* RECOGNITION RESULT */}
        {!isLowConfidence ? (
          <View className="p-4 bg-white rounded-3xl border border-[#613D2D]/12 gap-3">
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-base font-black text-[#2D1810]">
                  We found something! 🎉
                </Text>
                <Text className="text-xs text-[#8E7668] font-medium mt-0.5">
                  Recognized food:
                </Text>
                <Text className="text-xl font-extrabold text-[#E86A17] mt-0.5">
                  {activeDishName}
                </Text>
              </View>

              <View
                className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                  isHighConfidence
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : isMediumConfidence
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-rose-500/10 border-rose-500/30"
                }`}
              >
                <View
                  className={`w-2 h-2 rounded-full ${
                    isHighConfidence
                      ? "bg-emerald-500"
                      : isMediumConfidence
                        ? "bg-amber-500"
                        : "bg-rose-500"
                  }`}
                />
                <Text
                  className={`text-xs font-black ${
                    isHighConfidence
                      ? "text-emerald-700"
                      : isMediumConfidence
                        ? "text-amber-800"
                        : "text-rose-700"
                  }`}
                >
                  {confidenceScore}%
                </Text>
              </View>
            </View>

            <View className="p-3 bg-[#FDFBF7] rounded-2xl border border-[#613D2D]/10 flex-row items-center gap-2">
              <Sparkles width={16} height={16} color="#E86A17" />
              <Text className="text-xs text-[#613D2D] leading-relaxed flex-1">
                Shamsiya AI believes this image contains{" "}
                <Text className="text-[#2D1810] font-bold">
                  {activeDishName}
                </Text>
                .
              </Text>
            </View>
          </View>
        ) : (
          <View className="p-5 bg-rose-500/10 rounded-3xl border border-rose-500/30 items-center gap-3">
            <View className="w-12 h-12 rounded-2xl bg-rose-500/20 items-center justify-center">
              <AlertTriangle width={24} height={24} color="#BE123C" />
            </View>
            <View className="items-center">
              <Text className="text-base font-extrabold text-rose-950">
                We're not completely sure
              </Text>
              <Text className="text-xs text-rose-800 mt-1 max-w-[280px] text-center">
                Try taking another photo with better lighting or search manually
                for your favorite meal.
              </Text>
            </View>

            <View className="flex-row gap-2.5 w-full mt-1">
              <Pressable
                onPress={() => navigation.push("/food-scanner")}
                className="flex-1 py-3 rounded-2xl bg-[#E86A17] flex-row items-center justify-center gap-1.5"
              >
                <Camera width={16} height={16} color="#fff" />
                <Text className="text-white font-extrabold text-xs">
                  Scan Again
                </Text>
              </Pressable>
              <Pressable
                onPress={() => navigation.push("/explore")}
                className="flex-1 py-3 rounded-2xl bg-white border border-[#613D2D]/20 flex-row items-center justify-center gap-1.5"
              >
                <Search width={16} height={16} color="#8E7668" />
                <Text className="text-[#2D1810] font-extrabold text-xs">
                  Search Manually
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* DID YOU MEAN */}
        <View className="p-4 bg-white rounded-3xl border border-[#613D2D]/12 gap-2.5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <HelpCircle width={14} height={14} color="#E86A17" />
              <Text className="text-xs font-black uppercase tracking-wider text-[#2D1810]">
                Did you mean?
              </Text>
            </View>
            <Text className="text-[10px] text-[#8E7668]">
              Select correct food
            </Text>
          </View>

          <View className="gap-1.5">
            {candidateOptions.map((candidate, idx) => {
              const isSelected = activeDishName
                .toLowerCase()
                .includes(candidate.name.toLowerCase());
              return (
                <Pressable
                  key={idx}
                  onPress={() => setSelectedCandidate(candidate.name)}
                  className={`flex-row items-center justify-between p-2.5 rounded-2xl border ${
                    isSelected
                      ? "bg-[#E86A17]/10 border-[#E86A17]"
                      : "bg-[#FDFBF7] border-[#613D2D]/10"
                  }`}
                >
                  <View className="flex-row items-center gap-2">
                    <View
                      className={`w-4 h-4 rounded-full items-center justify-center border ${
                        isSelected
                          ? "border-[#E86A17] bg-[#E86A17]"
                          : "border-[#613D2D]/30"
                      }`}
                    >
                      {isSelected ? (
                        <Text className="text-white text-[9px]">✓</Text>
                      ) : null}
                    </View>
                    <Text className="text-xs font-bold text-[#613D2D]">
                      {candidate.name}
                    </Text>
                  </View>

                  <Text
                    className={`text-[11px] font-black ${
                      candidate.confidence >= 75
                        ? "text-emerald-700"
                        : candidate.confidence >= 50
                          ? "text-amber-700"
                          : "text-rose-700"
                    }`}
                  >
                    {candidate.confidence}%
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* MATCHING MENU ITEMS */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Sparkles width={16} height={16} color="#E86A17" />
              <Text className="text-sm font-black uppercase tracking-wider text-[#2D1810]">
                Available at Shamsiya
              </Text>
            </View>
            <Text className="text-[11px] text-[#8E7668] font-medium">
              {matchingFoods.length} matching meals
            </Text>
          </View>

          <View className="gap-3">
            {matchingFoods.map((food) => (
              <Pressable
                key={food.id}
                onPress={() => handleSelectMatchingFood(food)}
                className="p-3.5 bg-white rounded-3xl border border-[#613D2D]/12 gap-3"
              >
                <View className="flex-row gap-3 items-start">
                  <Image
                    source={{ uri: food.image }}
                    style={{ width: 80, height: 80, borderRadius: 16 }}
                  />

                  <View className="flex-1">
                    <View className="flex-row items-start justify-between gap-1">
                      <Text
                        numberOfLines={1}
                        className="text-sm font-extrabold text-[#2D1810] flex-1"
                      >
                        {food.name}
                      </Text>
                      <Text className="text-sm font-black text-[#E86A17]">
                        GH₵{food.priceGhc}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-1.5 mt-1">
                      <View className="flex-row">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            width={12}
                            height={12}
                            color="#FBBF24"
                            fill="#FBBF24"
                          />
                        ))}
                      </View>
                      <Text className="text-xs font-bold text-[#2D1810]">
                        {food.rating}
                      </Text>
                      <Text className="text-[10px] text-[#8E7668]">
                        ({food.reviewsCount})
                      </Text>
                    </View>

                    <Text
                      numberOfLines={2}
                      className="text-xs text-[#8E7668] mt-1 leading-snug"
                    >
                      "{food.description}"
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-2 pt-2 border-t border-[#613D2D]/8">
                  <Pressable
                    onPress={() => handleSelectMatchingFood(food)}
                    className="flex-1 py-2.5 px-3 rounded-2xl bg-[#F4EFE6] flex-row items-center justify-center gap-1.5"
                  >
                    <Text className="text-[#2D1810] text-xs font-extrabold">
                      View Food
                    </Text>
                    <ChevronRight width={14} height={14} color="#2D1810" />
                  </Pressable>

                  <Pressable
                    onPress={() => handleAddToCartDirect(food)}
                    className="py-2.5 px-4 rounded-2xl bg-[#E86A17] flex-row items-center justify-center gap-1.5"
                  >
                    <Plus width={14} height={14} color="#fff" strokeWidth={3} />
                    <Text className="text-white text-xs font-extrabold">
                      Add
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* BOTTOM CTA */}
        <View className="gap-2.5 pt-2">
          <PrimaryButton
            fullWidth
            size="lg"
            onPress={() => handleSelectMatchingFood(matchingFoods[0])}
            icon={
              <ShoppingBag
                width={16}
                height={16}
                color="#fff"
                strokeWidth={2.5}
              />
            }
          >
            Order Shamsiya Special Jollof (GH₵25)
          </PrimaryButton>

          <SecondaryButton
            fullWidth
            onPress={() => navigation.push("/food-scanner")}
            icon={<Camera width={16} height={16} color="#2D1810" />}
          >
            Scan Another Food
          </SecondaryButton>
        </View>
      </ScrollView>
    </View>
  );
}
