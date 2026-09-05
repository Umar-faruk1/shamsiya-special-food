import React from "react";
import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Heart,
  Sparkles,
  ChevronRight,
  SlidersHorizontal,
  Star,
  Plus,
  Clock,
} from "lucide-react-native";
import { FoodItem } from "../types";
import { EmptyState } from "../components/CommonModalsAndCards";
import { AppHeader } from "../components/AppHeader";
import { useApp } from "../context/AppContext";

// Direct port of FavoritesScreen.tsx
export default function FavoritesScreen() {
  const navigation = useRouter();
  const { foodItems, favorites, handleAddToCartQuick, handleToggleFavorite } =
    useApp();

  const favoriteFoods = foodItems.filter((f) => favorites.includes(f.id));

  const onSelectFood = (food: FoodItem) =>
    navigation.push({
      pathname: "/food-details-modal",
      params: { foodId: food.id },
    });

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader currentScreen="Favorites" title="My Favorites" showBack />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: 40,
          gap: 20,
        }}
      >
        {/* 1. HEADER */}
        <View className="flex-row items-center justify-between pt-1">
          <View>
            <Text className="text-xl font-black text-[#2D1810]">
              My Favorites ❤️
            </Text>
            <Text className="text-xs text-[#8E7668] font-medium mt-0.5">
              {favoriteFoods.length} saved{" "}
              {favoriteFoods.length === 1 ? "dish" : "dishes"}
            </Text>
          </View>

          <Pressable
            onPress={() => navigation.push("/preference")}
            className="px-3 py-1.5 rounded-full bg-[#F4EFE6] flex-row items-center gap-1.5"
          >
            <SlidersHorizontal width={14} height={14} color="#2D1810" />
            <Text className="text-[#2D1810] text-xs font-extrabold">
              Taste Profile
            </Text>
          </Pressable>
        </View>

        {/* 2. AI TASTE PROFILE */}
        <View className="relative rounded-3xl overflow-hidden p-4 border border-[#E86A17]/30 gap-3">
          <LinearGradient
            colors={["#2D1810", "#381B10", "#4F2516"]}
            style={{ position: "absolute", inset: 0 }}
          />

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <LinearGradient
                colors={["#E86A17", "#FFA028"]}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles width={16} height={16} color="#fff" />
              </LinearGradient>
              <Text className="text-sm font-black text-white">
                Your Taste Profile
              </Text>
            </View>

            <View className="px-2 py-0.5 rounded-md bg-white/10 border border-white/10">
              <Text className="text-[10px] uppercase font-black text-amber-300">
                AI Personalized
              </Text>
            </View>
          </View>

          <View className="gap-1.5">
            <Text className="text-xs text-amber-100 font-bold">
              You seem to like:
            </Text>
            <View className="flex-row flex-wrap gap-2 mt-0.5">
              {[
                { emoji: "🌶️", label: "Spicy foods" },
                { emoji: "🍗", label: "Chicken" },
                { emoji: "🍚", label: "Rice meals" },
              ].map((tag) => (
                <View
                  key={tag.label}
                  className="px-2.5 py-1 rounded-xl bg-white/15 border border-white/10 flex-row items-center gap-1"
                >
                  <Text>{tag.emoji}</Text>
                  <Text className="text-xs font-bold text-white">
                    {tag.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View className="pt-2 border-t border-white/15 flex-row items-center justify-between gap-2">
            <Text className="text-[11px] text-neutral-300 leading-snug flex-1">
              "These preferences help Shamsiya AI make better recommendations."
            </Text>

            <Pressable
              onPress={() => navigation.push("/preference")}
              className="px-3 py-1.5 rounded-xl bg-[#E86A17] flex-row items-center gap-1"
            >
              <Text className="text-white text-xs font-black">Manage</Text>
              <ChevronRight width={14} height={14} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* 3. FAVORITES GRID */}
        {favoriteFoods.length > 0 ? (
          <View className="gap-3">
            {Array.from({ length: Math.ceil(favoriteFoods.length / 2) }).map(
              (_, rowIdx) => (
                <View key={rowIdx} className="flex-row gap-3">
                  {favoriteFoods
                    .slice(rowIdx * 2, rowIdx * 2 + 2)
                    .map((food) => (
                      <Pressable
                        key={food.id}
                        onPress={() => onSelectFood(food)}
                        className="flex-1 bg-white rounded-3xl p-3 border border-[#613D2D]/10"
                      >
                        <View className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100 mb-2.5">
                          <Image
                            source={{ uri: food.image }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                          />
                          <Pressable
                            onPress={() => handleToggleFavorite(food)}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 items-center justify-center"
                            accessibilityLabel="Remove from favorites"
                          >
                            <Heart
                              width={14}
                              height={14}
                              color="#EF4444"
                              fill="#EF4444"
                            />
                          </Pressable>
                          <View className="absolute bottom-2 left-2 flex-row items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full">
                            <Clock width={10} height={10} color="#FCD34D" />
                            <Text className="text-white text-[10px] font-bold">
                              {food.prepTime}
                            </Text>
                          </View>
                        </View>

                        <Text
                          numberOfLines={1}
                          className="text-xs font-black text-[#2D1810]"
                        >
                          {food.name}
                        </Text>

                        <View className="flex-row items-center gap-1 mt-1 mb-2">
                          <Star
                            width={12}
                            height={12}
                            color="#FBBF24"
                            fill="#FBBF24"
                          />
                          <Text className="text-xs font-extrabold text-[#2D1810]">
                            {food.rating}
                          </Text>
                          <Text className="text-[10px] text-[#8E7668]">
                            ({food.reviewsCount})
                          </Text>
                        </View>

                        <View className="flex-row items-center justify-between pt-1 border-t border-neutral-100">
                          <Text className="text-sm font-black text-[#2D1810]">
                            ${food.price.toFixed(2)}
                          </Text>
                          <Pressable
                            onPress={() => handleAddToCartQuick(food)}
                            className="px-2.5 py-1 rounded-xl bg-[#F4EFE6] flex-row items-center gap-1"
                            accessibilityLabel={`Add ${food.name}`}
                          >
                            <Plus
                              width={14}
                              height={14}
                              color="#2D1810"
                              strokeWidth={2.5}
                            />
                            <Text className="text-xs font-extrabold text-[#2D1810]">
                              Add
                            </Text>
                          </Pressable>
                        </View>
                      </Pressable>
                    ))}
                  {favoriteFoods.slice(rowIdx * 2, rowIdx * 2 + 2).length ===
                  1 ? (
                    <View className="flex-1" />
                  ) : null}
                </View>
              ),
            )}
          </View>
        ) : (
          <EmptyState
            icon={
              <Heart width={32} height={32} color="#EF4444" fill="#EF4444" />
            }
            title="No Favorites Saved Yet"
            description="Tap the heart icon on any delicacy across Shamsiya to save it here for fast ordering."
            actionText="Discover Food"
            onAction={() => navigation.push("/explore")}
          />
        )}
      </ScrollView>
    </View>
  );
}
