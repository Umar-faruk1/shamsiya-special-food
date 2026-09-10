import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { X, Clock, Utensils, Check, AlertCircle } from "lucide-react-native";
import { Asset } from "expo-asset";
import { FoodItem } from "../types";
import { RatingStars, QuantitySelector } from "../components/BadgesAndRatings";
import { PrimaryButton } from "../components/Buttons";
import { fetchMenuItemDetail } from "../api/menu";

const placeholderImage = Asset.fromModule(
  require("../../assets/images/icon.png"),
).uri;

type MenuOption = {
  id: string;
  name: string;
  option_type: string | null;
  price: number;
};

type FoodDetail = Omit<FoodItem, "calories"> & { calories: number | null };

export default function FoodDetailsModal() {
  const router = useRouter();
  const { foodId } = useLocalSearchParams<{ foodId?: string }>();

  const [menuItem, setMenuItem] = useState<FoodDetail | null>(null);
  const [options, setOptions] = useState<MenuOption[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDetails = async () => {
      if (!foodId) {
        setError("We could not open this food item right now.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await fetchMenuItemDetail(foodId);
        if (!isMounted) return;

        const mappedOptions = (result.options ?? [])
          .filter((option) => option && option.is_available !== false)
          .map((option) => {
            const price = Number(option.price);
            return {
              id: option.id,
              name: option.name?.trim() || "Option",
              option_type: option.option_type?.trim() || "General",
              price,
            };
          })
          .filter((option) => Number.isFinite(option.price));

        setMenuItem(result.menuItem as FoodDetail);
        setOptions(mappedOptions);
      } catch (loadError: any) {
        if (!isMounted) return;
        console.error("Unable to load food details:", loadError);
        setError("We could not load this dish right now. Please try again.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadDetails();

    return () => {
      isMounted = false;
    };
  }, [foodId]);

  const optionGroups = useMemo(() => {
    const groups = new Map<string, MenuOption[]>();

    options.forEach((option) => {
      const groupName = option.option_type || "General";
      const existing = groups.get(groupName) ?? [];
      groups.set(groupName, [...existing, option]);
    });

    return Array.from(groups.entries()).sort(([left], [right]) =>
      left.localeCompare(right),
    );
  }, [options]);

  const selectedOptionPrice = useMemo(
    () =>
      options
        .filter((option) => selectedOptionIds.includes(option.id))
        .reduce((sum, option) => sum + option.price, 0),
    [options, selectedOptionIds],
  );

  const totalPrice = useMemo(() => {
    if (!menuItem) return 0;
    return (menuItem.price + selectedOptionPrice) * quantity;
  }, [menuItem, quantity, selectedOptionPrice]);

  const toggleOption = (optionId: string) => {
    setSelectedOptionIds((current) =>
      current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId],
    );
  };

  const handleAddToCart = () => {
    if (!menuItem) {
      Alert.alert("Menu item unavailable", "Please choose another dish.");
      return;
    }

    const preparedItem = {
      itemId: menuItem.id,
      quantity,
      selectedOptions: options.filter((option) =>
        selectedOptionIds.includes(option.id),
      ),
      totalPrice,
    };

    console.log("Prepared for future cart implementation:", preparedItem);
    Alert.alert(
      "Item prepared",
      "This selection is ready for the upcoming cart flow.",
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#FDFBF7] px-6">
        <ActivityIndicator size="large" color="#E86A17" />
        <Text className="mt-4 text-sm font-semibold text-[#613D2D]">
          Loading dish details...
        </Text>
      </View>
    );
  }

  if (error || !menuItem) {
    return (
      <View className="flex-1 bg-[#FDFBF7] px-6 justify-center">
        <View className="bg-white border border-[#613D2D]/10 rounded-3xl p-6 items-center">
          <AlertCircle width={28} height={28} color="#E86A17" />
          <Text className="mt-3 text-lg font-black text-[#2D1810] text-center">
            Dish unavailable
          </Text>
          <Text className="mt-2 text-sm text-[#613D2D] text-center">
            {error || "This food item is not available right now."}
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-5 bg-[#E86A17] rounded-xl px-4 py-2.5"
          >
            <Text className="text-sm font-bold text-white">Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#FDFBF7]">
      <View className="relative w-full aspect-[16/10] bg-neutral-900">
        <Image
          source={{ uri: menuItem.image || placeholderImage }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["rgba(0,0,0,0.7)", "transparent", "rgba(0,0,0,0.3)"]}
          style={{ position: "absolute", inset: 0 }}
        />

        <View className="absolute top-4 left-4 right-4 flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-white/90 items-center justify-center"
            accessibilityLabel="Close details"
          >
            <X width={16} height={16} color="#2D1810" strokeWidth={2.5} />
          </Pressable>
        </View>

        {menuItem.prepTime ? (
          <View className="absolute bottom-3 right-4 flex-row items-center gap-1 bg-black/60 px-2.5 py-1 rounded-full">
            <Clock width={11} height={11} color="#FCD34D" />
            <Text className="text-[11px] font-semibold text-amber-200">
              {menuItem.prepTime}
            </Text>
          </View>
        ) : null}
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 32, gap: 16 }}
      >
        <View>
          <View className="flex-row items-start justify-between gap-2">
            <Text className="text-lg font-black text-[#2D1810] leading-tight flex-1">
              {menuItem.name}
            </Text>
            <Text className="text-lg font-black text-[#E86A17]">
              ₵{menuItem.price.toFixed(2)}
            </Text>
          </View>

          <View className="flex-row items-center gap-3 mt-2 flex-wrap">
            {menuItem.rating > 0 || menuItem.reviewsCount > 0 ? (
              <RatingStars
                rating={menuItem.rating}
                count={menuItem.reviewsCount}
                size="sm"
              />
            ) : (
              <Text className="text-xs font-medium text-[#8E7668]">
                No reviews yet
              </Text>
            )}
            {menuItem.calories != null ? (
              <Text className="text-xs font-semibold text-[#613D2D]">
                🔥 {menuItem.calories} kcal
              </Text>
            ) : null}
          </View>
        </View>

        {menuItem.description ? (
          <Text className="text-xs text-[#613D2D] leading-relaxed">
            {menuItem.description}
          </Text>
        ) : null}

        {menuItem.ingredients && menuItem.ingredients.length > 0 ? (
          <View className="bg-[#F4EFE6] p-3 rounded-2xl border border-[#613D2D]/10">
            <View className="flex-row items-center gap-1 mb-2">
              <Utensils width={12} height={12} color="#E86A17" />
              <Text className="text-[11px] font-extrabold text-[#2D1810] uppercase tracking-wider">
                Ingredients
              </Text>
            </View>

            <View className="gap-1.5">
              {menuItem.ingredients.map((ingredient, index) => (
                <View
                  key={`${ingredient}-${index}`}
                  className="flex-row items-start gap-2"
                >
                  <Text className="text-[#E86A17] font-black">•</Text>
                  <Text className="text-[11px] text-[#2D1810] flex-1">
                    {ingredient}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {optionGroups.length > 0 ? (
          <View>
            <Text className="text-xs font-extrabold text-[#2D1810] uppercase tracking-wider mb-2">
              Available options
            </Text>
            <View className="gap-3">
              {optionGroups.map(([groupName, groupOptions]) => (
                <View
                  key={groupName}
                  className="bg-white border border-[#613D2D]/10 rounded-2xl p-3"
                >
                  <Text className="text-[11px] font-extrabold text-[#2D1810] mb-2 uppercase">
                    {groupName}
                  </Text>
                  <View className="gap-2">
                    {groupOptions.map((option) => {
                      const isSelected = selectedOptionIds.includes(option.id);

                      return (
                        <Pressable
                          key={option.id}
                          onPress={() => toggleOption(option.id)}
                          className={`flex-row items-center justify-between p-2.5 rounded-xl border ${
                            isSelected
                              ? "bg-[#FDFBF7] border-[#E86A17]"
                              : "bg-[#F8F4EF] border-[#613D2D]/10"
                          }`}
                        >
                          <View className="flex-row items-center gap-2.5">
                            <View
                              className={`w-5 h-5 rounded-md items-center justify-center border ${
                                isSelected
                                  ? "bg-[#E86A17] border-[#E86A17]"
                                  : "border-neutral-300 bg-white"
                              }`}
                            >
                              {isSelected ? (
                                <Check width={13} height={13} color="#fff" />
                              ) : null}
                            </View>
                            <Text className="text-xs font-bold text-[#2D1810]">
                              {option.name}
                            </Text>
                          </View>

                          <Text className="text-xs font-extrabold text-[#2D1810]">
                            +₵{option.price.toFixed(2)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View className="bg-white border border-[#613D2D]/10 rounded-2xl p-3">
          <Text className="text-[11px] font-extrabold text-[#2D1810] uppercase tracking-wider mb-2">
            Quantity
          </Text>
          <QuantitySelector
            quantity={quantity}
            onIncrease={() => setQuantity((value) => Math.min(value + 1, 99))}
            onDecrease={() => setQuantity((value) => Math.max(value - 1, 1))}
          />
        </View>
      </ScrollView>

      <View className="p-4 bg-white border-t border-[#613D2D]/12 flex-row items-center gap-3">
        <View className="flex-1">
          <Text className="text-[10px] text-[#8E7668] uppercase tracking-wider font-bold">
            Total
          </Text>
          <Text className="text-lg font-black text-[#E86A17]">
            ₵{totalPrice.toFixed(2)}
          </Text>
        </View>

        <View className="flex-1">
          <PrimaryButton size="lg" fullWidth onPress={handleAddToCart}>
            Add to Cart
          </PrimaryButton>
        </View>
      </View>
    </View>
  );
}
