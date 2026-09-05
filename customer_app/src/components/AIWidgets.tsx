import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles, Plus, Utensils, Bot, User, Zap } from "lucide-react-native";
import { AIChatMessage, FoodItem, FoodScanResult } from "../types";
import { RatingStars } from "./BadgesAndRatings";

// Direct port of AIWidgets.tsx
export const AIRecommendationCard: React.FC<{
  food: FoodItem;
  reason: string;
  onSelect: (food: FoodItem) => void;
  onAddToCart?: (food: FoodItem) => void;
}> = ({ food, reason, onSelect, onAddToCart }) => {
  return (
    <Pressable
      onPress={() => onSelect(food)}
      style={{ width: 240 }}
      className="rounded-3xl overflow-hidden p-3 border border-[#E86A17]/30"
    >
      <LinearGradient
        colors={["#2D1810", "#3B2117"]}
        style={{ position: "absolute", inset: 0, borderRadius: 24 }}
      />

      <View className="flex-row items-center gap-1.5 bg-[#E86A17]/20 border border-[#E86A17]/40 px-2.5 py-1 rounded-full mb-2.5 self-start">
        <Sparkles width={12} height={12} color="#E86A17" />
        <Text numberOfLines={1} className="text-[10px] text-amber-200 font-semibold">
          {reason}
        </Text>
      </View>

      <View className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-2 bg-neutral-800">
        <Image source={{ uri: food.image }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        <View className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded-full">
          <Text className="text-[10px] font-bold text-white">${food.price.toFixed(2)}</Text>
        </View>
      </View>

      <Text numberOfLines={1} className="text-xs font-extrabold text-white">
        {food.name}
      </Text>
      <Text numberOfLines={1} className="text-[10px] text-neutral-300 mb-2">
        {food.description}
      </Text>

      <View className="flex-row items-center justify-between pt-1 border-t border-white/10">
        <RatingStars rating={food.rating} size="sm" showNumber />
        <Pressable
          onPress={() => (onAddToCart ? onAddToCart(food) : onSelect(food))}
          className="px-2.5 py-1 rounded-xl bg-[#E86A17] flex-row items-center gap-1"
        >
          <Plus width={12} height={12} color="#fff" />
          <Text className="text-white text-[10px] font-bold">Add</Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

export const AIChatBubble: React.FC<{
  message: AIChatMessage;
  onSelectFood?: (food: FoodItem) => void;
  onAddToCart?: (food: FoodItem) => void;
  onQuickAction?: (action: string, payload?: any) => void;
}> = ({ message, onSelectFood, onAddToCart, onQuickAction }) => {
  const isUser = message.role === "user";

  return (
    <View
      className={`flex-row items-start gap-2.5 w-full my-2 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      <View
        className={`w-8 h-8 rounded-2xl items-center justify-center ${
          isUser ? "bg-[#613D2D]" : ""
        }`}
      >
        {!isUser ? (
          <LinearGradient
            colors={["#2D1810", "#E86A17"]}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              borderRadius: 16,
            }}
          />
        ) : null}
        {isUser ? (
          <User width={16} height={16} color="#fff" />
        ) : (
          <Bot width={16} height={16} color="#fff" />
        )}
      </View>

      <View className={`flex-1 gap-1 ${isUser ? "items-end" : "items-start"}`} style={{ maxWidth: "85%" }}>
        <View
          className={`p-3.5 rounded-3xl ${
            isUser ? "bg-[#2D1810]" : "bg-white border border-[#613D2D]/12"
          }`}
        >
          <Text className={`text-xs leading-relaxed ${isUser ? "text-white" : "text-[#2D1810]"}`}>
            {message.text}
          </Text>
        </View>

        <Text className="text-[9px] text-neutral-400 font-medium px-1">
          {message.timestamp}
        </Text>

        {message.suggestedDishes && message.suggestedDishes.length > 0 ? (
          <View className="gap-2 w-full mt-1">
            {message.suggestedDishes.map((dish) => (
              <Pressable
                key={dish.id}
                onPress={() => onSelectFood?.(dish)}
                className="flex-row items-center gap-2.5 p-2 bg-white rounded-2xl border border-[#613D2D]/15"
              >
                <Image
                  source={{ uri: dish.image }}
                  style={{ width: 48, height: 48, borderRadius: 12 }}
                />
                <View className="flex-1">
                  <Text numberOfLines={1} className="text-[11px] font-bold text-[#2D1810]">
                    {dish.name}
                  </Text>
                  <Text className="text-[10px] text-[#8E7668]">
                    ${dish.price.toFixed(2)} • {dish.calories} kcal
                  </Text>
                </View>
                {onAddToCart ? (
                  <Pressable
                    onPress={() => onAddToCart(dish)}
                    className="px-2.5 py-1 rounded-xl bg-[#F4EFE6] flex-row items-center gap-1"
                  >
                    <Plus width={12} height={12} color="#2D1810" />
                    <Text className="text-[10px] font-bold text-[#2D1810]">Add</Text>
                  </Pressable>
                ) : null}
              </Pressable>
            ))}
          </View>
        ) : null}

        {message.quickActions && message.quickActions.length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5 mt-1">
            {message.quickActions.map((qa, idx) => (
              <Pressable
                key={idx}
                onPress={() => onQuickAction?.(qa.action, qa.payload)}
                className="px-2.5 py-1 rounded-full bg-[#F4EFE6] border border-[#613D2D]/15"
              >
                <Text className="text-[10px] font-semibold text-[#2D1810]">{qa.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
};

export const FoodRecognitionResult: React.FC<{
  result: FoodScanResult;
  onAddToCart: (food: FoodItem) => void;
  onViewDetails: (food: FoodItem) => void;
}> = ({ result, onAddToCart, onViewDetails }) => {
  return (
    <View className="w-full bg-white rounded-3xl p-4 border border-[#613D2D]/15 gap-4">
      {/* Header confidence */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 flex-1">
          <View className="w-8 h-8 rounded-xl bg-emerald-500/15 items-center justify-center">
            <Zap width={16} height={16} color="#059669" />
          </View>
          <View className="flex-1">
            <Text numberOfLines={1} className="text-sm font-extrabold text-[#2D1810]">
              {result.recognizedDishName}
            </Text>
            <Text className="text-[11px] text-[#8E7668] font-medium">
              {result.detectedCuisine}
            </Text>
          </View>
        </View>

        <View className="items-end">
          <Text className="text-xs font-black text-emerald-600">{result.confidence}%</Text>
          <Text className="text-[9px] uppercase font-bold text-neutral-400">
            Match Confidence
          </Text>
        </View>
      </View>

      {/* Scanned image + description */}
      <View className="flex-row gap-3 items-center bg-[#FDFBF7] p-3 rounded-2xl border border-[#613D2D]/10">
        <Image
          source={{ uri: result.scannedImageUrl }}
          style={{ width: 80, height: 80, borderRadius: 12 }}
        />
        <View className="flex-1 gap-1">
          <Text numberOfLines={3} className="text-xs text-[#613D2D] leading-relaxed">
            {result.description}
          </Text>
          <View className="flex-row flex-wrap gap-1 pt-1">
            {result.flavorProfile?.map((flavor, i) => (
              <View key={i} className="px-2 py-0.5 rounded-md bg-[#F4EFE6]">
                <Text className="text-[9px] font-bold text-[#2D1810]">{flavor}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Detected ingredients */}
      <View>
        <View className="flex-row items-center gap-1 mb-1.5">
          <Utensils width={12} height={12} color="#E86A17" />
          <Text className="text-xs font-bold text-[#2D1810]">Key Detected Ingredients</Text>
        </View>
        <View className="flex-row flex-wrap gap-1.5">
          {result.detectedIngredients.map((ing, i) => (
            <View key={i} className="px-2.5 py-1 rounded-full bg-[#F4EFE6]">
              <Text className="text-[10px] font-medium text-[#2D1810]">{ing}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Macros */}
      <View className="flex-row bg-[#F9F6F0] p-2.5 rounded-2xl">
        {[
          { label: "Calories", value: result.nutritionEstimate.calories },
          { label: "Protein", value: result.nutritionEstimate.protein },
          { label: "Carbs", value: result.nutritionEstimate.carbs },
          { label: "Fat", value: result.nutritionEstimate.fat },
        ].map((m) => (
          <View key={m.label} className="flex-1 items-center">
            <Text className="text-xs font-extrabold text-[#2D1810]">{m.value}</Text>
            <Text className="text-[9px] text-[#8E7668]">{m.label}</Text>
          </View>
        ))}
      </View>

      {/* Matched menu dish */}
      <View className="bg-[#2D1810] p-3.5 rounded-2xl gap-2.5">
        <View className="flex-row items-center justify-between">
          <Text className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
            ★ Available on Shamsiya Menu
          </Text>
          <Text className="text-xs font-bold text-emerald-400">
            {result.matchPercentage}% Menu Fit
          </Text>
        </View>

        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-1">
            <Text numberOfLines={1} className="text-xs font-extrabold text-white">
              {result.matchedMenuDish.name}
            </Text>
            <Text className="text-[11px] text-amber-100/80">
              ${result.matchedMenuDish.price.toFixed(2)} • Ready in{" "}
              {result.matchedMenuDish.prepTime}
            </Text>
          </View>

          <View className="flex-row items-center gap-1.5">
            <Pressable
              onPress={() => onViewDetails(result.matchedMenuDish)}
              className="px-2.5 py-1.5 rounded-xl bg-white/10"
            >
              <Text className="text-white text-[11px] font-semibold">Details</Text>
            </Pressable>
            <Pressable
              onPress={() => onAddToCart(result.matchedMenuDish)}
              className="px-3 py-1.5 rounded-xl bg-[#E86A17] flex-row items-center gap-1"
            >
              <Plus width={14} height={14} color="#fff" strokeWidth={2.5} />
              <Text className="text-white text-[11px] font-bold">Order Dish</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};
