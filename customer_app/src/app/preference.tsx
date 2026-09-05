import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import {
  Sparkles,
  ShieldCheck,
  Check,
  Flame,
  Utensils,
  DollarSign,
  Save,
} from "lucide-react-native";
import { PrimaryButton, SecondaryButton } from "../components/Buttons";
import { AppHeader } from "../components/AppHeader";
import { useApp } from "../context/AppContext";

type SpicePref = "Mild" | "Medium" | "Spicy / Peppery" | "Fiery Hot";
type BudgetPref =
  | "Budget-Friendly (Under $12)"
  | "Mid-Range ($12 - $18)"
  | "Chef Premium ($18+)";

const cuisineOptions = [
  "West African",
  "South Asian / Biryani",
  "Middle Eastern",
  "Afro-Asian Fusion",
  "North Indian",
  "East African Swahili",
];

const categoryOptions = [
  "Rice",
  "Chicken",
  "Grills & Suya",
  "Snacks & Chaat",
  "Drinks & Smoothies",
  "Desserts",
  "Healthy Bowls",
];

const spiceOptions: SpicePref[] = [
  "Mild",
  "Medium",
  "Spicy / Peppery",
  "Fiery Hot",
];

const dietaryOptions = [
  "100% Halal Only",
  "High Protein (30g+)",
  "Vegetarian Friendly",
  "Nut Allergy Safe",
  "Dairy Free",
  "Gluten Sensitive",
  "Low Carb / Keto",
];

const budgetOptions: BudgetPref[] = [
  "Budget-Friendly (Under $12)",
  "Mid-Range ($12 - $18)",
  "Chef Premium ($18+)",
];

// Direct port of PreferencesScreen.tsx
export default function PreferencesScreen() {
  const navigation = useRouter();
  const { user, setUser, showToast } = useApp();

  const [cuisines, setCuisines] = useState<string[]>([
    "West African",
    "South Asian / Biryani",
    "Middle Eastern",
  ]);
  const [categories, setCategories] = useState<string[]>([
    "Rice",
    "Chicken",
    "Grills & Suya",
  ]);
  const [spice, setSpice] = useState<SpicePref>("Spicy / Peppery");
  const [dietary, setDietary] = useState<string[]>(
    user.dietaryPreferences.length
      ? user.dietaryPreferences
      : ["100% Halal Only", "High Protein"],
  );
  const [budget, setBudget] = useState<BudgetPref>("Mid-Range ($12 - $18)");
  const [savedToast, setSavedToast] = useState(false);

  const toggleItem = (
    list: string[],
    item: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter(
      list.includes(item) ? list.filter((i) => i !== item) : [...list, item],
    );
  };

  const handleSave = () => {
    setUser((prev) => ({ ...prev, dietaryPreferences: dietary }));
    showToast("Taste preferences updated");
    setSavedToast(true);
    setTimeout(() => {
      navigation.push("/favorites");
    }, 800);
  };

  const Pill = ({
    label,
    isSelected,
    onPress,
    activeClass,
  }: {
    label: string;
    isSelected: boolean;
    onPress: () => void;
    activeClass: string;
  }) => (
    <Pressable
      onPress={onPress}
      className={`px-3 py-2 rounded-2xl flex-row items-center gap-1.5 ${
        isSelected ? activeClass : "bg-[#F4EFE6]"
      }`}
    >
      {isSelected ? <Check width={14} height={14} color="#fff" /> : null}
      <Text
        className={`text-xs font-bold ${isSelected ? "text-white" : "text-[#2D1810]"}`}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader
        currentScreen="Preferences"
        title="Taste Preferences"
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
        {/* HEADER */}
        <View className="gap-1 pt-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-xl font-black text-[#2D1810]">
              Personalize Your Taste
            </Text>
            <Sparkles width={20} height={20} color="#E86A17" />
          </View>
          <Text className="text-xs text-[#8E7668]">
            Customize your flavor profile to help Shamsiya AI serve perfect
            recommendations.
          </Text>
        </View>

        {/* PRIVACY BANNER */}
        <View className="p-3 bg-[#FDFBF7] rounded-2xl border border-[#613D2D]/12 flex-row items-center gap-2.5">
          <View className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 items-center justify-center">
            <ShieldCheck width={16} height={16} color="#047857" />
          </View>
          <Text className="text-xs text-[#613D2D] leading-snug flex-1">
            "Your preferences are used to improve food recommendations."
          </Text>
        </View>

        {/* FAVORITE CUISINES */}
        <View className="p-4 bg-white rounded-3xl border border-[#613D2D]/12 gap-2.5">
          <Text className="text-xs font-black uppercase tracking-wider text-[#2D1810]">
            Favorite Cuisines
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {cuisineOptions.map((c) => (
              <Pill
                key={c}
                label={c}
                isSelected={cuisines.includes(c)}
                onPress={() => toggleItem(cuisines, c, setCuisines)}
                activeClass="bg-[#2D1810]"
              />
            ))}
          </View>
        </View>

        {/* FAVORITE CATEGORIES */}
        <View className="p-4 bg-white rounded-3xl border border-[#613D2D]/12 gap-2.5">
          <Text className="text-xs font-black uppercase tracking-wider text-[#2D1810]">
            Favorite Categories
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {categoryOptions.map((cat) => (
              <Pill
                key={cat}
                label={cat}
                isSelected={categories.includes(cat)}
                onPress={() => toggleItem(categories, cat, setCategories)}
                activeClass="bg-[#E86A17]"
              />
            ))}
          </View>
        </View>

        {/* SPICE PREFERENCE */}
        <View className="p-4 bg-white rounded-3xl border border-[#613D2D]/12 gap-2.5">
          <View className="flex-row items-center gap-1.5">
            <Flame width={14} height={14} color="#E86A17" />
            <Text className="text-xs font-black uppercase tracking-wider text-[#2D1810]">
              Spice Preference
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {spiceOptions.map((sp) => {
              const isSelected = spice === sp;
              return (
                <Pressable
                  key={sp}
                  onPress={() => setSpice(sp)}
                  style={{ width: "48%" }}
                  className={`p-2.5 rounded-2xl border flex-row items-center justify-between ${
                    isSelected
                      ? "bg-[#2D1810] border-[#2D1810]"
                      : "bg-[#FDFBF7] border-[#613D2D]/12"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${isSelected ? "text-white" : "text-[#2D1810]"}`}
                  >
                    {sp}
                  </Text>
                  {isSelected ? (
                    <Check width={14} height={14} color="#FCD34D" />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* DIETARY PREFERENCES */}
        <View className="p-4 bg-white rounded-3xl border border-[#613D2D]/12 gap-2.5">
          <View className="flex-row items-center gap-1.5">
            <Utensils width={14} height={14} color="#E86A17" />
            <Text className="text-xs font-black uppercase tracking-wider text-[#2D1810]">
              Dietary Preferences
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {dietaryOptions.map((d) => (
              <Pill
                key={d}
                label={d}
                isSelected={dietary.includes(d)}
                onPress={() => toggleItem(dietary, d, setDietary)}
                activeClass="bg-emerald-800"
              />
            ))}
          </View>
        </View>

        {/* BUDGET PREFERENCE */}
        <View className="p-4 bg-white rounded-3xl border border-[#613D2D]/12 gap-2.5">
          <View className="flex-row items-center gap-1.5">
            <DollarSign width={14} height={14} color="#E86A17" />
            <Text className="text-xs font-black uppercase tracking-wider text-[#2D1810]">
              Budget Preference
            </Text>
          </View>
          <View className="gap-2">
            {budgetOptions.map((b) => {
              const isSelected = budget === b;
              return (
                <Pressable
                  key={b}
                  onPress={() => setBudget(b)}
                  className={`p-3 rounded-2xl border flex-row items-center justify-between ${
                    isSelected
                      ? "bg-[#E86A17] border-[#E86A17]"
                      : "bg-[#FDFBF7] border-[#613D2D]/12"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${isSelected ? "text-white" : "text-[#2D1810]"}`}
                  >
                    {b}
                  </Text>
                  {isSelected ? (
                    <Check width={16} height={16} color="#fff" />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* SAVE ACTIONS */}
        <View className="gap-2 pt-2">
          <PrimaryButton
            fullWidth
            size="lg"
            onPress={handleSave}
            icon={<Save width={16} height={16} color="#fff" />}
          >
            {savedToast ? "Preferences Saved! ✓" : "Save Preferences"}
          </PrimaryButton>

          <SecondaryButton
            fullWidth
            onPress={() => navigation.push("/favorites")}
          >
            Cancel
          </SecondaryButton>
        </View>
      </ScrollView>
    </View>
  );
}
