import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Sparkles, ArrowRight } from "lucide-react-native";
import { FoodItem } from "../types";
import { FoodCard } from "../components/FoodCards";
import { AppHeader } from "../components/AppHeader";
import { useApp } from "../context/AppContext";

const moods = [
  {
    id: "lunch_energy",
    label: "⚡ Midday Power",
    desc: "High protein & sustained carbs",
  },
  {
    id: "spicy_craving",
    label: "🌶️ Fiery Spice Hit",
    desc: "Authentic Yaji & scotch bonnet",
  },
  {
    id: "comfort_feast",
    label: "🍲 Comfort Feast",
    desc: "Velvety gravies & clay pot rice",
  },
  {
    id: "sweet_finish",
    label: "🍯 Sweet & Refreshing",
    desc: "Pastries & probiotic lassis",
  },
];

// Direct port of AIRecommendationsScreen.tsx
export default function AIRecommendationsScreen() {
  const navigation = useRouter();
  const { foodItems, favorites, handleAddToCartQuick, handleToggleFavorite } =
    useApp();
  const [selectedMood, setSelectedMood] = useState<string>("lunch_energy");

  const getFilteredRecommendations = (): FoodItem[] => {
    switch (selectedMood) {
      case "lunch_energy":
        return [foodItems[0], foodItems[2], foodItems[5]].filter(Boolean);
      case "spicy_craving":
        return [foodItems[2], foodItems[7], foodItems[1]].filter(Boolean);
      case "comfort_feast":
        return [foodItems[3], foodItems[0], foodItems[4]].filter(Boolean);
      case "sweet_finish":
        return [foodItems[8], foodItems[9], foodItems[6]].filter(Boolean);
      default:
        return foodItems.slice(0, 4);
    }
  };

  const currentRecs = getFilteredRecommendations();

  const onSelectFood = (food: FoodItem) =>
    navigation.push({
      pathname: "/food-details-modal",
      params: { foodId: food.id },
    });

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader
        currentScreen="AIRecommendations"
        title="AI Recommendations"
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
        {/* HEADER BANNER */}
        <View className="p-4 rounded-3xl overflow-hidden border border-[#E86A17]/30 gap-2">
          <LinearGradient
            colors={["#2D1810", "#422318"]}
            style={{ position: "absolute", inset: 0 }}
          />
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-xl bg-[#E86A17] items-center justify-center">
              <Sparkles width={16} height={16} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-extrabold text-white">
                Shamsiya Smart Taste Matrix
              </Text>
              <Text className="text-[10px] text-amber-200">
                Personalized algorithms analyzing flavor notes & nutrition
              </Text>
            </View>
          </View>

          <View className="flex-row bg-black/30 p-2.5 rounded-2xl mt-2">
            <View className="flex-1 items-center">
              <Text className="text-xs font-black text-amber-300">98.4%</Text>
              <Text className="text-[9px] text-neutral-300">
                Taste Alignment
              </Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-xs font-black text-emerald-400">100%</Text>
              <Text className="text-[9px] text-neutral-300">
                Halal Certified
              </Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-xs font-black text-amber-300">
                &lt; 20m
              </Text>
              <Text className="text-[9px] text-neutral-300">Average Prep</Text>
            </View>
          </View>
        </View>

        {/* MOOD SELECTOR */}
        <View className="gap-2">
          <Text className="text-xs font-extrabold text-[#2D1810] uppercase tracking-wider">
            What are you feeling today?
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {moods.map((m) => {
              const isSelected = selectedMood === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setSelectedMood(m.id)}
                  style={{ width: "48%" }}
                  className={`p-3 rounded-2xl border ${
                    isSelected
                      ? "bg-[#2D1810] border-[#E86A17]"
                      : "bg-white border-[#613D2D]/12"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? "text-white" : "text-[#2D1810]"
                    }`}
                  >
                    {m.label}
                  </Text>
                  <Text
                    className={`text-[10px] mt-0.5 ${
                      isSelected ? "text-amber-200" : "text-[#8E7668]"
                    }`}
                  >
                    {m.desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* RESULTS GRID */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-extrabold text-[#2D1810] uppercase tracking-wider">
              Curated Matches ({currentRecs.length})
            </Text>
            <View className="px-2 py-0.5 rounded-full bg-emerald-50">
              <Text className="text-[10px] text-emerald-700 font-bold">
                Optimal Freshness
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            {currentRecs.map((food) => (
              <FoodCard
                key={food.id}
                food={food}
                onPress={onSelectFood}
                onAddToCart={handleAddToCartQuick}
                isFavorite={favorites.includes(food.id)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </View>
        </View>

        {/* BOTTOM AI CONCIERGE CTA */}
        <View className="p-4 bg-[#F4EFE6] rounded-3xl border border-[#613D2D]/15 flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <Text className="text-xs font-bold text-[#2D1810]">
              Want a deeper custom meal plan?
            </Text>
            <Text className="text-[10px] text-[#8E7668]">
              Chat with Shamsiya AI directly for calorie budgeting or large
              group combos.
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.push("/ai-assistant")}
            className="px-3 py-2 rounded-xl bg-[#2D1810] flex-row items-center gap-1"
          >
            <Text className="text-white text-xs font-bold">Chat AI</Text>
            <ArrowRight width={14} height={14} color="#fff" />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
