import React, { useState } from "react";
import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Sparkles,
  Camera,
  Search,
  ChevronRight,
  Heart,
  Plus,
  RotateCcw,
  Tag,
  Percent,
  TrendingUp,
  Flame,
  ArrowRight,
  Clock,
} from "lucide-react-native";
import { FoodItem } from "../../types";
import { RatingStars } from "../../components/BadgesAndRatings";
import { AppHeader } from "../../components/AppHeader";
import { useApp } from "../../context/AppContext";

const promoBanners = [
  {
    id: "promo-1",
    badge: "FIRST ORDER SPECIAL",
    title: "20% OFF YOUR FIRST ORDER",
    subtitle: "Discover something delicious today with Shamsiya recipes.",
    cta: "Order Now",
    image:
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "promo-2",
    badge: "AI MULTIMODAL SCAN",
    title: "Snap Any Food & Order",
    subtitle: "Upload or take a photo to instantly find matching chef meals.",
    cta: "Try Food Scanner",
    image:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "promo-3",
    badge: "CHEF SPECIAL DUM FEAST",
    title: "Authentic Jollof & Biryani",
    subtitle: "Slow cooked in sealed clay pots with aromatic spices.",
    cta: "Explore Menu",
    image:
      "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&auto=format&fit=crop&q=80",
  },
];

const categoryEmoji: Record<string, string> = {
  Rice: "🍚",
  Chicken: "🍗",
  Meat: "🥩",
  Snacks: "🥟",
  Drinks: "🥤",
  Desserts: "🍮",
  Popular: "🔥",
};

export default function HomeScreen() {
  const router = useRouter();
  const {
    categories,
    foodItems,
    orders,
    favorites,
    handleAddToCartQuick,
    handleToggleFavorite,
    user,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeBannerIdx, setActiveBannerIdx] = useState<number>(0);

  const popularDishes = foodItems.filter((item) => item.isPopular);
  const recommendedDishes = foodItems.slice(0, 4);
  const recentOrders = orders;

  const onSelectFood = (food: FoodItem) =>
    router.push({
      pathname: "/food-details-modal",
      params: { foodId: food.id },
    } as any);

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader
        currentScreen="Home"
        cartCount={0}
        favoritesCount={favorites.length}
        currentLocation={
          user.savedAddresses[0]?.street || "Downtown Gourmet Way"
        }
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. GREETING */}
        <View className="px-4 pt-1">
          <Text className="text-xl font-extrabold text-[#2D1810]">
            Good afternoon, {user.name?.split(" ")[0] || "Umar"} 👋
          </Text>
          <Text className="text-xs font-semibold text-[#8E7668] mt-0.5">
            What are you craving today?
          </Text>
        </View>

        {/* 2. SEARCH BAR */}
        <View className="px-4">
          <Pressable
            onPress={() => router.push("/(tabs)/explore")}
            className="flex-row items-center bg-white rounded-2xl border border-[#613D2D]/15 px-3.5 py-3"
            accessibilityLabel="Search for food, meals, or categories"
          >
            <Search width={20} height={20} color="#8E7668" />
            <Text className="text-sm text-[#8E7668]/80 font-medium ml-3 flex-1">
              Search for food, meals, or categories...
            </Text>
            <View className="px-2 py-0.5 rounded-lg bg-[#F4EFE6]">
              <Text className="text-[10px] font-extrabold text-[#2D1810]">
                Filter
              </Text>
            </View>
          </Pressable>
        </View>

        {/* 3. AI FOOD DISCOVERY SECTION */}
        <View className="px-4 gap-2.5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Sparkles width={16} height={16} color="#E86A17" />
              <Text className="text-sm font-extrabold text-[#2D1810]">
                How can we help you find food?
              </Text>
            </View>
            <View className="px-2 py-0.5 rounded-full bg-[#E86A17]/10">
              <Text className="text-[10px] font-bold text-[#E86A17] uppercase">
                AI Powered
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            {/* CARD 1 — ASK SHAMSIYA AI */}
            <Pressable
              onPress={() => router.push("/ai-assistant")}
              className="flex-1 p-3.5 rounded-3xl overflow-hidden"
            >
              <LinearGradient
                colors={["#2D1810", "#3D2015", "#542B1D"]}
                style={{ position: "absolute", inset: 0, borderRadius: 24 }}
              />
              <View className="flex-row items-center justify-between mb-2.5">
                <View className="w-9 h-9 rounded-2xl bg-[#E86A17] items-center justify-center">
                  <Sparkles width={20} height={20} color="#fff" />
                </View>
                <View className="px-2 py-0.5 rounded-full bg-white/10">
                  <Text className="text-[9px] font-extrabold uppercase text-amber-300">
                    Assistant
                  </Text>
                </View>
              </View>

              <Text className="text-sm font-extrabold text-white leading-snug">
                Ask Shamsiya AI
              </Text>
              <Text className="text-[11px] text-neutral-300 font-medium leading-tight mt-1">
                Tell me what you're craving and I'll recommend something.
              </Text>

              <View className="mt-2 p-1.5 rounded-xl bg-black/30 border border-white/10">
                <Text
                  numberOfLines={1}
                  className="text-[10px] text-amber-200/90 italic"
                >
                  "Something spicy under GH₵50"
                </Text>
              </View>

              <Pressable
                onPress={() => router.push("/ai-assistant")}
                className="mt-3 py-1.5 px-3 rounded-xl bg-[#E86A17] flex-row items-center justify-center gap-1"
              >
                <Text className="text-white text-xs font-extrabold">
                  Ask AI
                </Text>
                <ArrowRight width={14} height={14} color="#fff" />
              </Pressable>
            </Pressable>

            {/* CARD 2 — SCAN FOOD */}
            <Pressable
              onPress={() => router.push("/food-scanner")}
              className="flex-1 p-3.5 rounded-3xl overflow-hidden"
            >
              <LinearGradient
                colors={["#E86A17", "#DF600F", "#C9530A"]}
                style={{ position: "absolute", inset: 0, borderRadius: 24 }}
              />
              <View className="flex-row items-center justify-between mb-2.5">
                <View className="w-9 h-9 rounded-2xl bg-[#2D1810] items-center justify-center">
                  <Camera width={20} height={20} color="#FCD34D" />
                </View>
                <View className="px-2 py-0.5 rounded-full bg-white/40">
                  <Text className="text-[9px] font-extrabold uppercase text-[#2D1810]">
                    Vision
                  </Text>
                </View>
              </View>

              <Text className="text-sm font-extrabold text-white leading-snug">
                Scan a Food
              </Text>
              <Text className="text-[11px] text-amber-100 font-medium leading-tight mt-1">
                See a food you like? Take a photo and we'll find similar meals.
              </Text>

              <View className="mt-2 p-1.5 rounded-xl bg-black/20 flex-row items-center gap-1">
                <Camera width={12} height={12} color="#fff" />
                <Text
                  numberOfLines={1}
                  className="text-[10px] text-white/90 font-medium"
                >
                  Instant dish & cal matching
                </Text>
              </View>

              <Pressable
                onPress={() => router.push("/food-scanner")}
                className="mt-3 py-1.5 px-3 rounded-xl bg-[#2D1810] flex-row items-center justify-center gap-1"
              >
                <Text className="text-white text-xs font-extrabold">
                  Scan Food
                </Text>
                <Camera width={14} height={14} color="#fff" />
              </Pressable>
            </Pressable>
          </View>
        </View>

        {/* 4. PROMOTIONAL BANNER CAROUSEL */}
        <View className="px-4 gap-2">
          <View
            className="relative w-full rounded-3xl overflow-hidden p-4 justify-between"
            style={{ minHeight: 140 }}
          >
            <LinearGradient
              colors={["#2D1810", "#422318", "#E86A17"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ position: "absolute", inset: 0 }}
            />
            <Image
              source={{ uri: promoBanners[activeBannerIdx].image }}
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: "50%",
                opacity: 0.35,
              }}
              resizeMode="cover"
            />

            <View style={{ maxWidth: "65%" }} className="gap-1">
              <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 self-start">
                <Percent width={10} height={10} color="#FCD34D" />
                <Text className="text-[9px] font-extrabold uppercase text-amber-200">
                  {promoBanners[activeBannerIdx].badge}
                </Text>
              </View>

              <Text className="text-base font-extrabold text-white mt-0.5">
                {promoBanners[activeBannerIdx].title}
              </Text>

              <Text
                numberOfLines={2}
                className="text-[11px] text-amber-100/90 font-medium mb-2"
              >
                {promoBanners[activeBannerIdx].subtitle}
              </Text>

              <Pressable
                onPress={() => {
                  if (activeBannerIdx === 1) {
                    router.push("/food-scanner");
                  } else if (foodItems.length > 0) {
                    onSelectFood(foodItems[0]);
                  }
                }}
                className="flex-row items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white self-start"
              >
                <Text className="text-xs font-extrabold text-[#2D1810]">
                  {promoBanners[activeBannerIdx].cta}
                </Text>
                <ArrowRight width={14} height={14} color="#E86A17" />
              </Pressable>
            </View>

            <View className="flex-row items-center gap-1.5 self-end mt-1">
              {promoBanners.map((_, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => setActiveBannerIdx(idx)}
                  className={`h-1.5 rounded-full ${
                    activeBannerIdx === idx
                      ? "w-5 bg-amber-300"
                      : "w-1.5 bg-white/40"
                  }`}
                  accessibilityLabel={`Slide ${idx + 1}`}
                />
              ))}
            </View>
          </View>
        </View>

        {/* 5. EXPLORE CATEGORIES */}
        <View className="gap-2.5">
          <View className="flex-row items-center justify-between px-4">
            <View className="flex-row items-center gap-1.5">
              <Flame width={16} height={16} color="#E86A17" />
              <Text className="text-sm font-extrabold text-[#2D1810]">
                Explore Categories
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/(tabs)/explore")}
              className="flex-row items-center gap-0.5"
            >
              <Text className="text-xs font-bold text-[#E86A17]">View All</Text>
              <ChevronRight width={14} height={14} color="#E86A17" />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
          >
            <Pressable
              onPress={() => {
                setSelectedCategory("all");
                router.push("/(tabs)/explore");
              }}
              style={{ minWidth: 70 }}
              className={`items-center gap-1.5 p-2 rounded-2xl ${
                selectedCategory === "all"
                  ? "bg-[#2D1810]"
                  : "bg-white border border-[#613D2D]/10"
              }`}
            >
              <View
                className={`w-11 h-11 rounded-xl items-center justify-center ${
                  selectedCategory === "all" ? "bg-[#E86A17]" : "bg-[#F4EFE6]"
                }`}
              >
                <Text className="font-extrabold text-sm">★</Text>
              </View>
              <Text
                className={`text-[11px] font-bold ${
                  selectedCategory === "all" ? "text-white" : "text-[#2D1810]"
                }`}
              >
                All
              </Text>
            </Pressable>

            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => {
                  setSelectedCategory(cat.id);
                  router.push("/(tabs)/explore");
                }}
                style={{ minWidth: 76 }}
                className={`items-center gap-1.5 p-2 rounded-2xl ${
                  selectedCategory === cat.id
                    ? "bg-[#2D1810]"
                    : "bg-white border border-[#613D2D]/10"
                }`}
              >
                <View
                  className={`w-11 h-11 rounded-xl items-center justify-center ${
                    selectedCategory === cat.id
                      ? "bg-[#E86A17]"
                      : "bg-[#F4EFE6]"
                  }`}
                >
                  <Text className="text-sm">
                    {categoryEmoji[cat.name] || "🍲"}
                  </Text>
                </View>
                <Text
                  numberOfLines={1}
                  className={`text-[11px] font-bold text-center ${
                    selectedCategory === cat.id
                      ? "text-white"
                      : "text-[#2D1810]"
                  }`}
                >
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* 6. POPULAR FOOD (HORIZONTAL CARDS) */}
        <View className="gap-2.5">
          <View className="flex-row items-center justify-between px-4">
            <View>
              <View className="flex-row items-center gap-1.5">
                <TrendingUp width={16} height={16} color="#E86A17" />
                <Text className="text-sm font-extrabold text-[#2D1810]">
                  Popular at Shamsiya
                </Text>
              </View>
              <Text className="text-[10px] text-[#8E7668] font-medium">
                Customer favorites ordered daily
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/(tabs)/explore")}
              className="flex-row items-center gap-0.5"
            >
              <Text className="text-xs font-bold text-[#E86A17]">See All</Text>
              <ChevronRight width={14} height={14} color="#E86A17" />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          >
            {popularDishes.map((food) => {
              const isFav = favorites.includes(food.id);
              return (
                <Pressable
                  key={food.id}
                  onPress={() => onSelectFood(food)}
                  style={{ width: 200 }}
                  className="bg-white rounded-3xl p-3 border border-[#613D2D]/10"
                >
                  <View className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100 mb-2">
                    <Image
                      source={{ uri: food.image }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                    <Pressable
                      onPress={() => handleToggleFavorite(food)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 items-center justify-center"
                      accessibilityLabel="Toggle favorite"
                    >
                      <Heart
                        width={14}
                        height={14}
                        color={isFav ? "#EF4444" : "#525252"}
                        fill={isFav ? "#EF4444" : "none"}
                      />
                    </Pressable>
                    <View className="absolute bottom-2 left-2 bg-black/50 px-2 py-0.5 rounded-full flex-row items-center gap-1">
                      <Clock width={10} height={10} color="#FCD34D" />
                      <Text className="text-white text-[9px] font-bold">
                        {food.prepTime}
                      </Text>
                    </View>
                  </View>

                  <Text
                    numberOfLines={1}
                    className="text-xs font-bold text-[#2D1810]"
                  >
                    {food.name}
                  </Text>

                  <View className="flex-row items-center justify-between mt-1 mb-2">
                    <RatingStars rating={food.rating} size="sm" showNumber />
                    <Text className="text-[10px] text-neutral-500 font-medium">
                      {food.calories} kcal
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between pt-1.5 border-t border-neutral-100">
                    <Text className="text-xs font-extrabold text-[#2D1810]">
                      ${food.price.toFixed(2)}
                    </Text>
                    <Pressable
                      onPress={() => handleAddToCartQuick(food)}
                      className="w-7 h-7 rounded-xl bg-[#F4EFE6] items-center justify-center"
                      accessibilityLabel={`Add ${food.name}`}
                    >
                      <Plus
                        width={14}
                        height={14}
                        color="#2D1810"
                        strokeWidth={2.5}
                      />
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* 7. AI RECOMMENDATIONS SECTION */}
        <View className="px-4 gap-2.5">
          <View className="flex-row items-center justify-between">
            <View>
              <View className="flex-row items-center gap-1.5">
                <Sparkles width={16} height={16} color="#E86A17" />
                <Text className="text-sm font-extrabold text-[#2D1810]">
                  Recommended For You ✨
                </Text>
              </View>
              <Text className="text-[10px] text-[#8E7668] font-medium">
                Personalized by Shamsiya AI
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/ai-recommendations")}
              className="flex-row items-center gap-0.5"
            >
              <Text className="text-xs font-bold text-[#E86A17]">
                Explore AI
              </Text>
              <ChevronRight width={14} height={14} color="#E86A17" />
            </Pressable>
          </View>

          {/* 2-Column Food Cards */}
          <View className="gap-3">
            {Array.from({
              length: Math.ceil(recommendedDishes.length / 2),
            }).map((_, rowIdx) => (
              <View key={rowIdx} className="flex-row gap-3">
                {recommendedDishes
                  .slice(rowIdx * 2, rowIdx * 2 + 2)
                  .map((food) => {
                    const isFav = favorites.includes(food.id);
                    return (
                      <Pressable
                        key={food.id}
                        onPress={() => onSelectFood(food)}
                        className="flex-1 bg-white rounded-3xl p-3 border border-[#613D2D]/10"
                      >
                        <View className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100 mb-2">
                          <Image
                            source={{ uri: food.image }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                          />
                          <View className="absolute top-2 left-2 flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-[#2D1810] border border-[#E86A17]/40">
                            <Sparkles width={10} height={10} color="#E86A17" />
                            <Text className="text-[9px] font-extrabold text-amber-300">
                              AI Pick
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => handleToggleFavorite(food)}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 items-center justify-center"
                            accessibilityLabel="Add to favorites"
                          >
                            <Heart
                              width={14}
                              height={14}
                              color={isFav ? "#EF4444" : "#525252"}
                              fill={isFav ? "#EF4444" : "none"}
                            />
                          </Pressable>
                          <View className="absolute bottom-2 left-2 bg-black/50 px-2 py-0.5 rounded-full flex-row items-center gap-1">
                            <Clock width={10} height={10} color="#FCD34D" />
                            <Text className="text-white text-[9px] font-bold">
                              {food.prepTime}
                            </Text>
                          </View>
                        </View>

                        <Text
                          numberOfLines={1}
                          className="text-xs font-bold text-[#2D1810]"
                        >
                          {food.name}
                        </Text>

                        <View className="flex-row items-center justify-between mt-1 mb-2">
                          <RatingStars rating={food.rating} size="sm" />
                          <Text className="text-[10px] text-neutral-500 font-medium">
                            {food.calories} kcal
                          </Text>
                        </View>

                        <View className="flex-row items-center justify-between pt-1.5 border-t border-neutral-100">
                          <Text className="text-xs font-extrabold text-[#2D1810]">
                            ${food.price.toFixed(2)}
                          </Text>
                          <Pressable
                            onPress={() => handleAddToCartQuick(food)}
                            className="w-7 h-7 rounded-xl bg-[#F4EFE6] items-center justify-center"
                            accessibilityLabel={`Add ${food.name}`}
                          >
                            <Plus
                              width={14}
                              height={14}
                              color="#2D1810"
                              strokeWidth={2.5}
                            />
                          </Pressable>
                        </View>
                      </Pressable>
                    );
                  })}
              </View>
            ))}
          </View>
        </View>

        {/* 8. ORDER AGAIN */}
        {recentOrders && recentOrders.length > 0 ? (
          <View className="gap-2.5 px-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <RotateCcw width={16} height={16} color="#E86A17" />
                <Text className="text-sm font-extrabold text-[#2D1810]">
                  Order Again
                </Text>
              </View>
              <Pressable onPress={() => router.push("/(tabs)/orders")}>
                <Text className="text-xs font-bold text-[#E86A17]">
                  Order History
                </Text>
              </Pressable>
            </View>

            <View className="gap-2.5">
              {recentOrders.slice(0, 2).map((order) => {
                const mainItem = order.items[0]?.food;
                if (!mainItem) return null;

                return (
                  <Pressable
                    key={order.id}
                    onPress={() => onSelectFood(mainItem)}
                    className="p-3 bg-white rounded-3xl border border-[#613D2D]/12 flex-row items-center justify-between gap-3"
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <Image
                        source={{ uri: mainItem.image }}
                        style={{ width: 52, height: 52, borderRadius: 16 }}
                      />
                      <View className="flex-1">
                        <Text
                          numberOfLines={1}
                          className="text-xs font-bold text-[#2D1810]"
                        >
                          {mainItem.name}
                        </Text>
                        <Text className="text-[10px] text-[#8E7668] mt-0.5">
                          {order.items.length > 1
                            ? `+${order.items.length - 1} more items • `
                            : ""}
                          ${order.total.toFixed(2)}
                        </Text>
                        <View className="mt-1 px-1.5 py-0.5 rounded bg-emerald-50 self-start">
                          <Text className="text-[9px] font-bold text-emerald-600">
                            Delivered
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => handleAddToCartQuick(mainItem)}
                      className="px-3.5 py-2 rounded-xl bg-[#2D1810] flex-row items-center gap-1"
                    >
                      <RotateCcw width={12} height={12} color="#E86A17" />
                      <Text className="text-white text-xs font-extrabold">
                        Reorder
                      </Text>
                    </Pressable>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* 9. SPECIAL OFFERS */}
        <View className="gap-2.5 px-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Tag width={16} height={16} color="#E86A17" />
              <Text className="text-sm font-extrabold text-[#2D1810]">
                Special Offers & Deals
              </Text>
            </View>
            <Text className="text-[10px] font-bold text-[#8E7668]">
              Valid today in Accra
            </Text>
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => onSelectFood(foodItems[1] || foodItems[0])}
              className="flex-1 p-3.5 rounded-3xl bg-[#FDF3E7] border border-[#E86A17]/25 justify-between"
            >
              <View>
                <View className="px-2 py-0.5 rounded-full bg-[#E86A17] self-start mb-1.5">
                  <Text className="text-[9px] font-extrabold text-white uppercase">
                    Save GH₵15
                  </Text>
                </View>
                <Text className="text-xs font-extrabold text-[#2D1810] leading-tight">
                  Lunch Feast Combo
                </Text>
                <Text
                  numberOfLines={2}
                  className="text-[10px] text-[#8E7668] mt-1"
                >
                  Jollof Royale + Grilled Chicken + Sobolo drink
                </Text>
              </View>
              <View className="flex-row items-center justify-between mt-3 pt-1.5 border-t border-[#E86A17]/15">
                <Text className="text-xs font-extrabold text-[#E86A17]">
                  GH₵ 45.00
                </Text>
                <Text className="text-[10px] text-neutral-400 line-through">
                  GH₵ 60.00
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push("/ai-assistant")}
              className="flex-1 p-3.5 rounded-[#ECE5DB] border border-[#613D2D]/15 justify-between"
            >
              <View>
                <View className="px-2 py-0.5 rounded-full bg-[#2D1810] self-start mb-1.5">
                  <Text className="text-[9px] font-extrabold text-amber-300 uppercase">
                    Free Delivery
                  </Text>
                </View>
                <Text className="text-xs font-extrabold text-[#2D1810] leading-tight">
                  AI Smart Pair Deal
                </Text>
                <Text
                  numberOfLines={2}
                  className="text-[10px] text-[#8E7668] mt-1"
                >
                  Ask Shamsiya AI for meal pairing & get 0 delivery fee.
                </Text>
              </View>
              <View className="flex-row items-center justify-between mt-3 pt-1.5 border-t border-[#613D2D]/10">
                <View className="flex-row items-center gap-1">
                  <Sparkles width={11} height={11} color="#E86A17" />
                  <Text className="text-[10px] font-extrabold text-[#2D1810]">
                    Ask Concierge
                  </Text>
                </View>
                <ArrowRight width={11} height={11} color="#2D1810" />
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
