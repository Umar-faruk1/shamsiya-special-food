import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Plus, Flame, Clock, Heart, Sparkles } from "lucide-react-native";
import { FoodItem } from "../types";
import { RatingStars } from "./BadgesAndRatings";

interface FoodCardProps {
  food: FoodItem;
  onPress: (food: FoodItem) => void;
  onAddToCart?: (food: FoodItem) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (food: FoodItem) => void;
}

// Direct port of FoodCards.tsx (FoodCard, HorizontalFoodCard, FoodGrid).
// CSS grid becomes a flex-wrap layout with fixed-percentage widths.
export const FoodCard: React.FC<FoodCardProps> = ({
  food,
  onPress,
  onAddToCart,
  isFavorite = false,
  onToggleFavorite,
}) => {
  return (
    <Pressable
      onPress={() => onPress(food)}
      className="flex-1 bg-white rounded-3xl p-3 border border-[#613D2D]/10"
      style={{
        boxShadow: "0px 4px 8px rgba(45, 24, 16, 0.04)",
      }}
    >
      {/* Image Container */}
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

        {/* Halal & Chef Special badges top left */}
        <View className="absolute top-2 left-2 gap-1">
          {food.isChefSpecial ? (
            <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-[#E86A17] self-start">
              <Sparkles width={10} height={10} color="#fff" />
              <Text className="text-[10px] font-extrabold text-white">
                Chef Special
              </Text>
            </View>
          ) : null}
          {food.isHalal ? (
            <View className="px-1.5 py-0.5 rounded-full bg-[#16A34A] self-start">
              <Text className="text-[9px] font-bold text-white">100% Halal</Text>
            </View>
          ) : null}
        </View>

        {/* Favorite Heart Button top right */}
        {onToggleFavorite ? (
          <Pressable
            onPress={() => onToggleFavorite(food)}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 items-center justify-center"
            accessibilityLabel="Add to favorites"
          >
            <Heart
              width={14}
              height={14}
              color={isFavorite ? "#EF4444" : "#525252"}
              fill={isFavorite ? "#EF4444" : "none"}
            />
          </Pressable>
        ) : null}

        {/* Prep Time & Spicy level bottom of image */}
        <View className="absolute bottom-2 left-2 right-2 flex-row items-center justify-between">
          <View className="flex-row items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full">
            <Clock width={11} height={11} color="#FCD34D" />
            <Text className="text-[11px] font-semibold text-white">
              {food.prepTime}
            </Text>
          </View>

          {food.spicyLevel > 0 ? (
            <View className="flex-row items-center gap-0.5 bg-black/40 px-2 py-0.5 rounded-full">
              {Array.from({ length: food.spicyLevel }).map((_, i) => (
                <Flame key={i} width={11} height={11} color="#FBBF24" fill="#FBBF24" />
              ))}
            </View>
          ) : null}
        </View>
      </View>

      {/* Content */}
      <View className="flex-1">
        <Text numberOfLines={1} className="text-sm font-bold text-[#2D1810]">
          {food.name}
        </Text>

        {food.nativeName ? (
          <Text numberOfLines={1} className="text-[11px] text-[#8E7668] font-medium mb-1">
            {food.nativeName}
          </Text>
        ) : null}

        {/* Rating & Calories */}
        <View className="flex-row items-center justify-between pt-1 mb-2">
          <RatingStars rating={food.rating} size="sm" />
          <Text className="text-[11px] font-medium text-neutral-500">
            {food.calories} kcal
          </Text>
        </View>

        {/* Price & Add to Cart button */}
        <View className="flex-row items-center justify-between pt-1 border-t border-neutral-100">
          <View className="flex-row items-baseline gap-1.5">
            <Text className="text-base font-extrabold text-[#2D1810]">
              ${food.price.toFixed(2)}
            </Text>
            {food.originalPrice ? (
              <Text className="text-xs text-neutral-400 line-through">
                ${food.originalPrice.toFixed(2)}
              </Text>
            ) : null}
          </View>

          <Pressable
            onPress={() => (onAddToCart ? onAddToCart(food) : onPress(food))}
            className="w-8 h-8 rounded-2xl bg-[#F4EFE6] items-center justify-center active:bg-[#E86A17]"
            accessibilityLabel={`Add ${food.name} to order`}
          >
            <Plus width={16} height={16} color="#2D1810" strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

export const HorizontalFoodCard: React.FC<FoodCardProps> = ({
  food,
  onPress,
  onAddToCart,
  isFavorite = false,
  onToggleFavorite,
}) => {
  return (
    <Pressable
      onPress={() => onPress(food)}
      className="flex-row items-center gap-3 bg-white rounded-3xl p-2.5 border border-[#613D2D]/10"
      style={{
        boxShadow: "0px 3px 6px rgba(45, 24, 16, 0.03)",
      }}
    >
      {/* Thumbnail */}
      <View className="relative w-24 h-24 rounded-2xl overflow-hidden bg-neutral-100">
        <Image
          source={{ uri: food.image }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
        {food.isChefSpecial ? (
          <View className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-[#E86A17]">
            <Text className="text-[8px] font-extrabold text-white">Special</Text>
          </View>
        ) : null}
      </View>

      {/* Details */}
      <View className="flex-1 pr-1">
        <View className="flex-row items-start justify-between gap-1">
          <Text numberOfLines={1} className="text-xs font-bold text-[#2D1810] flex-1">
            {food.name}
          </Text>
          {onToggleFavorite ? (
            <Pressable onPress={() => onToggleFavorite(food)} className="p-0.5">
              <Heart
                width={14}
                height={14}
                color={isFavorite ? "#EF4444" : "#A3A3A3"}
                fill={isFavorite ? "#EF4444" : "none"}
              />
            </Pressable>
          ) : null}
        </View>

        <Text numberOfLines={1} className="text-[10px] text-[#8E7668] mb-1">
          {food.description}
        </Text>

        <View className="flex-row items-center gap-2 mb-1">
          <RatingStars rating={food.rating} size="sm" showNumber />
          <Text className="text-[10px] text-neutral-400">•</Text>
          <View className="flex-row items-center gap-1">
            <Clock width={10} height={10} color="#A3A3A3" />
            <Text className="text-[10px] text-neutral-500 font-medium">
              {food.prepTime}
            </Text>
          </View>
        </View>

        {/* Price & Add */}
        <View className="flex-row items-center justify-between mt-auto">
          <Text className="text-xs font-extrabold text-[#2D1810]">
            ${food.price.toFixed(2)}
          </Text>

          <Pressable
            onPress={() => (onAddToCart ? onAddToCart(food) : onPress(food))}
            className="px-2.5 py-1 rounded-xl bg-[#F4EFE6] flex-row items-center gap-1 active:bg-[#E86A17]"
          >
            <Plus width={12} height={12} color="#2D1810" strokeWidth={2.5} />
            <Text className="text-[11px] font-bold text-[#2D1810]">Add</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

export const FoodGrid: React.FC<{
  foods: FoodItem[];
  onSelectFood: (food: FoodItem) => void;
  onAddToCart?: (food: FoodItem) => void;
  favorites?: string[];
  onToggleFavorite?: (food: FoodItem) => void;
}> = ({ foods, onSelectFood, onAddToCart, favorites = [], onToggleFavorite }) => {
  const rows: FoodItem[][] = [];
  for (let i = 0; i < foods.length; i += 2) {
    rows.push(foods.slice(i, i + 2));
  }

  return (
    <View className="gap-3">
      {rows.map((row, i) => (
        <View key={i} className="flex-row gap-3">
          {row.map((food) => (
            <FoodCard
              key={food.id}
              food={food}
              onPress={onSelectFood}
              onAddToCart={onAddToCart}
              isFavorite={favorites.includes(food.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
          {row.length === 1 ? <View className="flex-1" /> : null}
        </View>
      ))}
    </View>
  );
};
