import React, { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  TextInput,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Flame,
  Clock,
  Sparkles,
  Search,
  Camera,
  Heart,
  Star,
  Plus,
  X,
} from "lucide-react-native";
import { FoodItem } from "../types";
import { EmptyState } from "../components/CommonModalsAndCards";
import { AppHeader } from "../components/AppHeader";
import { useApp } from "../context/AppContext";

type PriceTier = "all" | "budget" | "mid" | "premium";
type SortBy = "popularity" | "rating" | "price_asc" | "price_desc";

const priceTierOptions: { value: PriceTier; label: string }[] = [
  { value: "all", label: "Price: All" },
  { value: "budget", label: "Under $12" },
  { value: "mid", label: "$12 - $16" },
  { value: "premium", label: "$16+" },
];

const ratingOptions: { value: number; label: string }[] = [
  { value: 0, label: "Rating: Any" },
  { value: 4.8, label: "★ 4.8+" },
  { value: 4.5, label: "★ 4.5+" },
];

const sortOptions: { value: SortBy; label: string }[] = [
  { value: "popularity", label: "Popularity" },
  { value: "rating", label: "Top Rated ★" },
  { value: "price_asc", label: "Price: Low→High" },
  { value: "price_desc", label: "Price: High→Low" },
];

// Direct port of ExploreScreen.tsx. Web <select> dropdowns become
// tap-to-cycle pill buttons (RN has no native inline <select>).
export default function ExploreScreen() {
  const navigation = useRouter();
  const {
    categories,
    foodItems,
    favorites,
    handleAddToCartQuick,
    handleToggleFavorite,
  } = useApp();
  const searchInputRef = useRef<TextInput>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activePriceTier, setActivePriceTier] = useState<PriceTier>("all");
  const [activeRatingMin, setActiveRatingMin] = useState<number>(0);
  const [activePopularOnly, setActivePopularOnly] = useState<boolean>(false);
  const [activeDiscoveryTab, setActiveDiscoveryTab] = useState<
    "search" | "ai" | "scan"
  >("search");
  const [sortBy, setSortBy] = useState<SortBy>("popularity");

  const onSelectFood = (food: FoodItem) =>
    navigation.push({
      pathname: "/food-details-modal",
      params: { foodId: food.id },
    });

  const filteredFoods = useMemo(() => {
    return foodItems
      .filter((item) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = item.name.toLowerCase().includes(q);
          const matchesNative = item.nativeName?.toLowerCase().includes(q);
          const matchesDesc = item.description.toLowerCase().includes(q);
          const matchesTag = item.tags.some((t) => t.toLowerCase().includes(q));
          const matchesIng = item.ingredients.some((i) =>
            i.toLowerCase().includes(q),
          );
          if (
            !matchesName &&
            !matchesNative &&
            !matchesDesc &&
            !matchesTag &&
            !matchesIng
          ) {
            return false;
          }
        }
        if (selectedCategory !== "all" && item.category !== selectedCategory)
          return false;
        if (activePriceTier === "budget" && item.price > 12) return false;
        if (activePriceTier === "mid" && (item.price <= 12 || item.price > 16))
          return false;
        if (activePriceTier === "premium" && item.price <= 16) return false;
        if (activeRatingMin > 0 && item.rating < activeRatingMin) return false;
        if (activePopularOnly && !item.isPopular && !item.isChefSpecial)
          return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "popularity") {
          const aPop = (a.isPopular ? 2 : 0) + (a.isChefSpecial ? 1 : 0);
          const bPop = (b.isPopular ? 2 : 0) + (b.isChefSpecial ? 1 : 0);
          if (bPop !== aPop) return bPop - aPop;
          return b.rating - a.rating;
        }
        if (sortBy === "rating") return b.rating - a.rating;
        if (sortBy === "price_asc") return a.price - b.price;
        if (sortBy === "price_desc") return b.price - a.price;
        return 0;
      });
  }, [
    foodItems,
    searchQuery,
    selectedCategory,
    activePriceTier,
    activeRatingMin,
    activePopularOnly,
    sortBy,
  ]);

  const activeFilterCount =
    (selectedCategory !== "all" ? 1 : 0) +
    (activePriceTier !== "all" ? 1 : 0) +
    (activeRatingMin > 0 ? 1 : 0) +
    (activePopularOnly ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedCategory("all");
    setActivePriceTier("all");
    setActiveRatingMin(0);
    setActivePopularOnly(false);
    setSearchQuery("");
  };

  const cyclePriceTier = () => {
    const idx = priceTierOptions.findIndex((o) => o.value === activePriceTier);
    setActivePriceTier(
      priceTierOptions[(idx + 1) % priceTierOptions.length].value,
    );
  };

  const cycleRating = () => {
    const idx = ratingOptions.findIndex((o) => o.value === activeRatingMin);
    setActiveRatingMin(ratingOptions[(idx + 1) % ratingOptions.length].value);
  };

  const cycleSort = () => {
    const idx = sortOptions.findIndex((o) => o.value === sortBy);
    setSortBy(sortOptions[(idx + 1) % sortOptions.length].value);
  };

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader
        currentScreen="Explore"
        title="Discover Food"
        favoritesCount={favorites.length}
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 48,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. HEADER ROW */}
        <View className="gap-2 pt-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-black text-[#2D1810]">
              Discover Food
            </Text>
            <Text className="text-xs text-[#8E7668] font-medium">
              {filteredFoods.length} dishes available
            </Text>
          </View>

          {/* Search bar */}
          <View className="flex-row items-center bg-white rounded-2xl border border-[#613D2D]/15 px-3.5 py-2.5">
            <Search width={16} height={16} color="#8E7668" />
            <TextInput
              ref={searchInputRef}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search or scan a food."
              placeholderTextColor="rgba(142,118,104,0.7)"
              className="flex-1 ml-2.5 text-sm text-[#2D1810] font-medium"
            />
            {searchQuery ? (
              <Pressable
                onPress={() => setSearchQuery("")}
                className="w-5 h-5 rounded-full bg-neutral-200 items-center justify-center ml-1.5"
                accessibilityLabel="Clear search"
              >
                <X width={12} height={12} color="#525252" />
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => navigation.push("/food-scanner")}
              className="ml-2 p-1.5 rounded-xl bg-[#F4EFE6]"
              accessibilityLabel="Scan food with camera"
            >
              <Camera width={16} height={16} color="#2D1810" />
            </Pressable>
          </View>
        </View>

        {/* 2. THREE DISCOVERY ACTIONS */}
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => {
              setActiveDiscoveryTab("search");
              searchInputRef.current?.focus();
            }}
            className={`flex-1 p-3 rounded-2xl border justify-between ${
              activeDiscoveryTab === "search"
                ? "bg-[#2D1810] border-[#2D1810]"
                : "bg-white border-[#613D2D]/12"
            }`}
          >
            <View className="w-8 h-8 rounded-xl bg-[#E86A17]/15 items-center justify-center mb-1.5">
              <Search width={16} height={16} color="#E86A17" />
            </View>
            <View>
              <Text
                className={`text-xs font-black ${
                  activeDiscoveryTab === "search"
                    ? "text-white"
                    : "text-[#2D1810]"
                }`}
              >
                Search
              </Text>
              <Text
                className={`text-[10px] mt-0.5 font-medium ${
                  activeDiscoveryTab === "search"
                    ? "text-neutral-300"
                    : "text-[#8E7668]"
                }`}
              >
                Find a meal
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => navigation.push("/ai-assistant")}
            className="flex-1 p-3 rounded-2xl bg-orange-50 border border-[#E86A17]/30 justify-between"
          >
            <View className="w-8 h-8 rounded-xl bg-[#E86A17] items-center justify-center mb-1.5">
              <Sparkles width={16} height={16} color="#fff" />
            </View>
            <View>
              <Text className="text-xs font-black text-[#2D1810]">Ask AI</Text>
              <Text
                numberOfLines={1}
                className="text-[10px] text-[#8E7668] mt-0.5 font-medium"
              >
                Tell us what you want
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => navigation.push("/food-scanner")}
            className="flex-1 p-3 rounded-2xl bg-white border border-[#613D2D]/12 justify-between"
          >
            <View className="w-8 h-8 rounded-xl bg-[#F4EFE6] items-center justify-center mb-1.5">
              <Camera width={16} height={16} color="#2D1810" />
            </View>
            <View>
              <Text className="text-xs font-black text-[#2D1810]">Scan</Text>
              <Text className="text-[10px] text-[#8E7668] mt-0.5 font-medium">
                Identify food
              </Text>
            </View>
          </Pressable>
        </View>

        {/* 3. FILTERS & SORT BAR */}
        <View className="gap-2.5">
          {/* Category Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6 }}
          >
            <Pressable
              onPress={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-full ${
                selectedCategory === "all"
                  ? "bg-[#2D1810]"
                  : "bg-white border border-[#613D2D]/15"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  selectedCategory === "all" ? "text-white" : "text-[#8E7668]"
                }`}
              >
                All Categories
              </Text>
            </Pressable>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full ${
                    isSelected
                      ? "bg-[#2D1810]"
                      : "bg-white border border-[#613D2D]/15"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? "text-white" : "text-[#8E7668]"
                    }`}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Quick Filter Pills */}
          <View className="flex-row items-center justify-between gap-2">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, flexGrow: 1 }}
            >
              <Pressable
                onPress={cyclePriceTier}
                className={`px-2.5 py-1 rounded-xl border ${
                  activePriceTier !== "all"
                    ? "bg-[#E86A17] border-[#E86A17]"
                    : "bg-white border-[#613D2D]/15"
                }`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    activePriceTier !== "all" ? "text-white" : "text-[#613D2D]"
                  }`}
                >
                  {
                    priceTierOptions.find((o) => o.value === activePriceTier)
                      ?.label
                  }
                </Text>
              </Pressable>

              <Pressable
                onPress={cycleRating}
                className={`px-2.5 py-1 rounded-xl border ${
                  activeRatingMin > 0
                    ? "bg-[#E86A17] border-[#E86A17]"
                    : "bg-white border-[#613D2D]/15"
                }`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    activeRatingMin > 0 ? "text-white" : "text-[#613D2D]"
                  }`}
                >
                  {
                    ratingOptions.find((o) => o.value === activeRatingMin)
                      ?.label
                  }
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActivePopularOnly(!activePopularOnly)}
                className={`px-2.5 py-1 rounded-xl border flex-row items-center gap-1 ${
                  activePopularOnly
                    ? "bg-[#E86A17] border-[#E86A17]"
                    : "bg-white border-[#613D2D]/15"
                }`}
              >
                <Flame
                  width={11}
                  height={11}
                  color={activePopularOnly ? "#fff" : "#613D2D"}
                />
                <Text
                  className={`text-[11px] font-bold ${
                    activePopularOnly ? "text-white" : "text-[#613D2D]"
                  }`}
                >
                  Popular Only
                </Text>
              </Pressable>

              {activeFilterCount > 0 ? (
                <Pressable
                  onPress={clearAllFilters}
                  className="px-1.5 justify-center"
                >
                  <Text className="text-[10px] font-bold text-red-600 underline">
                    Reset
                  </Text>
                </Pressable>
              ) : null}
            </ScrollView>

            <Pressable
              onPress={cycleSort}
              className="bg-white border border-[#613D2D]/15 rounded-xl px-2 py-1"
            >
              <Text className="text-[#2D1810] text-xs font-bold">
                {sortOptions.find((o) => o.value === sortBy)?.label}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 4. FOOD RESULTS: TWO-COLUMN GRID */}
        {filteredFoods.length > 0 ? (
          <View className="gap-3">
            {Array.from({ length: Math.ceil(filteredFoods.length / 2) }).map(
              (_, rowIdx) => (
                <View key={rowIdx} className="flex-row gap-3">
                  {filteredFoods
                    .slice(rowIdx * 2, rowIdx * 2 + 2)
                    .map((food) => {
                      const isFavorite = favorites.includes(food.id);
                      return (
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
                            <LinearGradient
                              colors={["rgba(0,0,0,0.5)", "transparent"]}
                              start={{ x: 0, y: 1 }}
                              end={{ x: 0, y: 0 }}
                              style={{ position: "absolute", inset: 0 }}
                            />
                            <Pressable
                              onPress={() => handleToggleFavorite(food)}
                              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 items-center justify-center"
                              accessibilityLabel="Toggle favorite"
                            >
                              <Heart
                                width={14}
                                height={14}
                                color={isFavorite ? "#EF4444" : "#525252"}
                                fill={isFavorite ? "#EF4444" : "none"}
                              />
                            </Pressable>
                            <View className="absolute bottom-2 left-2 flex-row items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full">
                              <Clock width={10} height={10} color="#FCD34D" />
                              <Text className="text-[10px] font-bold text-white">
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
                      );
                    })}
                  {filteredFoods.slice(rowIdx * 2, rowIdx * 2 + 2).length ===
                  1 ? (
                    <View className="flex-1" />
                  ) : null}
                </View>
              ),
            )}
          </View>
        ) : (
          <EmptyState
            icon={<Search width={32} height={32} color="#8E7668" />}
            title="No dishes found"
            description="Try changing your search terms, price tier, or filters."
            actionText="Reset All Filters"
            onAction={clearAllFilters}
          />
        )}
      </ScrollView>
    </View>
  );
}
