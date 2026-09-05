import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  X,
  Heart,
  Clock,
  Sparkles,
  Check,
  Utensils,
  AlertCircle,
} from "lucide-react-native";
import { FoodOptionAddon } from "../types";
import { RatingStars, QuantitySelector } from "../components/BadgesAndRatings";
import { PrimaryButton } from "../components/Buttons";
import { useApp } from "../context/AppContext";

const spiceLevels = [
  { label: "Mild 🍃" },
  { label: "Medium 🌶️" },
  { label: "Hot 🔥" },
  { label: "Extra Fiery 🌋" },
];

// Direct port of FoodDetailsModal.tsx. Presented via native-stack's
// `presentation: "modal"` (set in RootNavigator), so it slides up exactly
// like the web bottom-sheet without needing a manual Modal wrapper here.
export default function FoodDetailsModal() {
  const navigation = useRouter();
  const { foodId } = useLocalSearchParams<{ foodId?: string }>();
  const {
    foodItems,
    favorites,
    handleToggleFavorite,
    handleAddToCartWithOptions,
  } = useApp();

  const food = useMemo(
    () => foodItems.find((f) => f.id === foodId) || foodItems[0],
    [foodItems, foodId],
  );
  const isFavorite = favorites.includes(food.id);

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>(
    food.availableSizes?.[0]?.name || "Standard",
  );
  const [selectedSpice, setSelectedSpice] = useState<string>("Medium 🌶️");
  const [selectedAddons, setSelectedAddons] = useState<FoodOptionAddon[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [addedToast, setAddedToast] = useState(false);

  const sizeExtra =
    food.availableSizes?.find((s) => s.name === selectedSize)?.extraPrice || 0;
  const addonsExtra = selectedAddons.reduce((acc, a) => acc + a.price, 0);
  const unitPrice = food.price + sizeExtra + addonsExtra;
  const totalPrice = unitPrice * quantity;

  const toggleAddon = (addon: FoodOptionAddon) => {
    setSelectedAddons((prev) =>
      prev.some((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon],
    );
  };

  const handleAddToCart = () => {
    handleAddToCartWithOptions(food, quantity, {
      size: selectedSize,
      spiceLevel: selectedSpice,
      addons: selectedAddons,
      specialInstructions: specialInstructions.trim() || undefined,
    });
    setAddedToast(true);
    setTimeout(() => {
      setAddedToast(false);
      navigation.back();
    }, 600);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-[#FDFBF7]"
    >
      {/* HERO IMAGE */}
      <View className="relative w-full aspect-[16/10] bg-neutral-900">
        <Image
          source={{ uri: food.image }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["rgba(0,0,0,0.7)", "transparent", "rgba(0,0,0,0.3)"]}
          style={{ position: "absolute", inset: 0 }}
        />

        <View className="absolute top-4 left-4 right-4 flex-row items-center justify-between">
          <Pressable
            onPress={() => navigation.back()}
            className="w-9 h-9 rounded-full bg-white/90 items-center justify-center"
            accessibilityLabel="Close details"
          >
            <X width={16} height={16} color="#2D1810" strokeWidth={2.5} />
          </Pressable>

          <Pressable
            onPress={() => handleToggleFavorite(food)}
            className="w-9 h-9 rounded-full bg-white/90 items-center justify-center"
            accessibilityLabel="Toggle favorite"
          >
            <Heart
              width={16}
              height={16}
              color={isFavorite ? "#EF4444" : "#404040"}
              fill={isFavorite ? "#EF4444" : "none"}
            />
          </Pressable>
        </View>

        <View className="absolute bottom-3 left-4 right-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            {food.isChefSpecial ? (
              <View className="flex-row items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E86A17]">
                <Sparkles width={11} height={11} color="#fff" />
                <Text className="text-[10px] font-extrabold text-white">
                  Chef Special
                </Text>
              </View>
            ) : null}
            {food.isHalal ? (
              <View className="px-2 py-0.5 rounded-full bg-[#16A34A]">
                <Text className="text-[10px] font-bold text-white">
                  100% Halal
                </Text>
              </View>
            ) : null}
          </View>

          <View className="flex-row items-center gap-1 bg-black/60 px-2.5 py-1 rounded-full">
            <Clock width={11} height={11} color="#FCD34D" />
            <Text className="text-[11px] font-semibold text-amber-200">
              {food.prepTime}
            </Text>
          </View>
        </View>
      </View>

      {/* SCROLLABLE BODY */}
      <ScrollView className="flex-1 p-4" contentContainerStyle={{ gap: 16 }}>
        <View>
          <View className="flex-row items-start justify-between gap-2">
            <Text className="text-lg font-black text-[#2D1810] leading-tight flex-1">
              {food.name}
            </Text>
            <Text className="text-lg font-black text-[#E86A17]">
              ${food.price.toFixed(2)}
            </Text>
          </View>

          {food.nativeName ? (
            <Text className="text-xs font-semibold text-[#8E7668] mt-0.5">
              {food.nativeName}
            </Text>
          ) : null}

          <View className="flex-row items-center gap-3 mt-2">
            <RatingStars
              rating={food.rating}
              count={food.reviewsCount}
              size="sm"
            />
            <Text className="text-neutral-300">•</Text>
            <Text className="text-xs font-semibold text-[#613D2D]">
              🔥 {food.calories} kcal
            </Text>
          </View>
        </View>

        <Text className="text-xs text-[#613D2D] leading-relaxed">
          {food.description}
        </Text>

        {/* Ingredients & Allergens */}
        <View className="bg-[#F4EFE6] p-3 rounded-2xl border border-[#613D2D]/10">
          <View className="flex-row items-center gap-1 mb-1.5">
            <Utensils width={12} height={12} color="#E86A17" />
            <Text className="text-[11px] font-extrabold text-[#2D1810] uppercase tracking-wider">
              Authentic Ingredients
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-1">
            {food.ingredients.map((ing, i) => (
              <View
                key={i}
                className="px-2 py-0.5 rounded-md bg-white border border-neutral-200"
              >
                <Text className="text-[10px] font-medium text-[#2D1810]">
                  {ing}
                </Text>
              </View>
            ))}
          </View>

          {food.allergens.length > 0 ? (
            <View className="flex-row items-start gap-1 mt-2">
              <AlertCircle width={12} height={12} color="#D97706" />
              <Text className="text-[10px] text-amber-800 font-medium flex-1">
                Allergen Note: {food.allergens.join(", ")}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Nutrition Macros */}
        <View className="flex-row bg-white p-3 rounded-2xl border border-[#613D2D]/10">
          {[
            { label: "Calories", value: food.nutrition.calories },
            { label: "Protein", value: food.nutrition.protein },
            { label: "Carbs", value: food.nutrition.carbs },
            { label: "Fat", value: food.nutrition.fat },
          ].map((m) => (
            <View key={m.label} className="flex-1 items-center">
              <Text className="text-xs font-bold text-[#2D1810]">
                {m.value}
              </Text>
              <Text className="text-[9px] text-[#8E7668]">{m.label}</Text>
            </View>
          ))}
        </View>

        {/* Portion size */}
        {food.availableSizes && food.availableSizes.length > 0 ? (
          <View>
            <Text className="text-xs font-extrabold text-[#2D1810] uppercase tracking-wider mb-2">
              Choose Portion Size
            </Text>
            <View className="flex-row gap-2">
              {food.availableSizes.map((size) => (
                <Pressable
                  key={size.name}
                  onPress={() => setSelectedSize(size.name)}
                  className={`flex-1 p-2.5 rounded-2xl items-center border ${
                    selectedSize === size.name
                      ? "bg-[#2D1810] border-[#E86A17]"
                      : "bg-white border-[#613D2D]/15"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      selectedSize === size.name
                        ? "text-white"
                        : "text-[#2D1810]"
                    }`}
                  >
                    {size.name}
                  </Text>
                  <Text
                    className={`text-[10px] ${
                      selectedSize === size.name
                        ? "text-amber-300"
                        : "text-[#8E7668]"
                    }`}
                  >
                    {size.extraPrice === 0
                      ? "Base Price"
                      : `+$${size.extraPrice.toFixed(2)}`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* Spice customization */}
        {food.spiceCustomizable ? (
          <View>
            <Text className="text-xs font-extrabold text-[#2D1810] uppercase tracking-wider mb-2">
              Customize Spice Level
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {spiceLevels.map((sp) => (
                <Pressable
                  key={sp.label}
                  onPress={() => setSelectedSpice(sp.label)}
                  style={{ width: "48%" }}
                  className={`p-2 rounded-xl items-center border ${
                    selectedSpice === sp.label
                      ? "bg-[#E86A17] border-[#E86A17]"
                      : "bg-white border-[#613D2D]/15"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      selectedSpice === sp.label
                        ? "text-white"
                        : "text-[#2D1810]"
                    }`}
                  >
                    {sp.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* Add-ons */}
        {food.addons && food.addons.length > 0 ? (
          <View>
            <Text className="text-xs font-extrabold text-[#2D1810] uppercase tracking-wider mb-2">
              Add-on Sides & Extras
            </Text>
            <View className="gap-2">
              {food.addons.map((addon) => {
                const isChecked = selectedAddons.some((a) => a.id === addon.id);
                return (
                  <Pressable
                    key={addon.id}
                    onPress={() => toggleAddon(addon)}
                    className={`flex-row items-center justify-between p-2.5 rounded-2xl border ${
                      isChecked
                        ? "bg-[#FDFBF7] border-[#E86A17]"
                        : "bg-white border-[#613D2D]/15"
                    }`}
                  >
                    <View className="flex-row items-center gap-2.5">
                      <View
                        className={`w-5 h-5 rounded-md items-center justify-center border ${
                          isChecked
                            ? "bg-[#E86A17] border-[#E86A17]"
                            : "border-neutral-300"
                        }`}
                      >
                        {isChecked ? (
                          <Check width={13} height={13} color="#fff" />
                        ) : null}
                      </View>
                      <Text className="text-xs font-bold text-[#2D1810]">
                        {addon.name}
                      </Text>
                    </View>
                    <Text className="text-xs font-extrabold text-[#2D1810]">
                      +${addon.price.toFixed(2)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Special instructions */}
        <View>
          <Text className="text-xs font-extrabold text-[#2D1810] uppercase tracking-wider mb-1.5">
            Special Kitchen Instructions
          </Text>
          <TextInput
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            placeholder="e.g. Extra caramelized shallots, sauce on the side, no onions..."
            placeholderTextColor="rgba(142,118,104,0.7)"
            multiline
            numberOfLines={2}
            className="w-full bg-white border border-[#613D2D]/15 rounded-2xl p-3 text-xs text-[#2D1810]"
            style={{ minHeight: 60, textAlignVertical: "top" }}
          />
        </View>
      </ScrollView>

      {/* STICKY FOOTER */}
      <View className="p-4 bg-white border-t border-[#613D2D]/12 flex-row items-center gap-3">
        <QuantitySelector
          quantity={quantity}
          onIncrease={() => setQuantity(quantity + 1)}
          onDecrease={() => quantity > 1 && setQuantity(quantity - 1)}
        />

        <View className="flex-1">
          <PrimaryButton size="lg" fullWidth onPress={handleAddToCart}>
            {addedToast
              ? "Added to Feast! ✓"
              : `Add to Cart • $${totalPrice.toFixed(2)}`}
          </PrimaryButton>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
