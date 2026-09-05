import React, { useState } from "react";
import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  MapPin,
  CreditCard,
  Heart,
  Bell,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Settings,
  HelpCircle,
  LogOut,
  Award,
  Check,
} from "lucide-react-native";
import { BottomSheet } from "../components/CommonModalsAndCards";
import { AppHeader } from "../components/AppHeader";
import { useApp } from "../context/AppContext";

const availableOptions = [
  "100% Halal Only",
  "High Protein (30g+)",
  "Spicy / Peppery",
  "Nut Allergy Safe",
  "Vegetarian Friendly",
  "Low Carb / Keto",
  "Dairy Free",
  "Gluten Sensitive",
];

// Direct port of ProfileScreen.tsx
export default function ProfileScreen() {
  const navigation = useRouter();
  const { user, setUser, favorites, setIsAuthenticated, showToast } = useApp();

  const [isDietaryModalOpen, setIsDietaryModalOpen] = useState(false);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>(
    user.dietaryPreferences,
  );

  const togglePref = (opt: string) => {
    setSelectedPreferences((prev) =>
      prev.includes(opt) ? prev.filter((p) => p !== opt) : [...prev, opt],
    );
  };

  const handleSaveDietary = () => {
    setUser((prev) => ({ ...prev, dietaryPreferences: selectedPreferences }));
    showToast("Dietary preferences updated");
    setIsDietaryModalOpen(false);
  };

  const menuSections = [
    {
      label: "Food & AI Experience",
      items: [
        {
          id: "preferences",
          icon: <Sparkles width={16} height={16} color="#E86A17" />,
          title: "AI Taste Profile & Preferences",
          subtitle: `${user.dietaryPreferences.length} preferences active`,
          action: () => navigation.push("/preference"),
        },
        {
          id: "favorites",
          icon: <Heart width={16} height={16} color="#EF4444" fill="#EF4444" />,
          title: "My Favorites ❤️",
          subtitle: `${favorites.length} saved dishes`,
          action: () => navigation.push("/favorites"),
        },
        {
          id: "reviews",
          icon: <Award width={16} height={16} color="#F59E0B" />,
          title: "My Food Reviews",
          subtitle: "Ratings & feedback history",
          action: () => navigation.push("/reviews"),
        },
      ],
    },
    {
      label: "Account & Preferences",
      items: [
        {
          id: "addresses",
          icon: <MapPin width={16} height={16} color="#2D1810" />,
          title: "Saved Delivery Addresses",
          subtitle: `${user.savedAddresses?.length || 0} locations`,
          action: () => navigation.push("/addresses"),
        },
        {
          id: "payment",
          icon: <CreditCard width={16} height={16} color="#2D1810" />,
          title: "Payment Methods",
          subtitle: `${user.savedPaymentMethods?.length || 0} cards & wallets`,
          action: () => navigation.push("/payment-methods"),
        },
        {
          id: "notifications",
          icon: <Bell width={16} height={16} color="#2D1810" />,
          title: "Notifications & Deals",
          subtitle: "Push alerts & order milestones",
          action: () => navigation.push("/notifications"),
        },
        {
          id: "settings",
          icon: <Settings width={16} height={16} color="#2D1810" />,
          title: "App Settings",
          subtitle: "Language, theme & security",
          action: () => navigation.push("/settings"),
        },
        {
          id: "help",
          icon: <HelpCircle width={16} height={16} color="#2D1810" />,
          title: "Help & Support",
          subtitle: "FAQs & customer concierge",
          action: () => navigation.push("/help-support"),
        },
      ],
    },
  ];

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader currentScreen="Profile" favoritesCount={favorites.length} />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: 48,
          gap: 20,
        }}
      >
        {/* 1. USER PROFILE CARD */}
        <View className="relative rounded-3xl border border-[#E86A17]/30 overflow-hidden p-4">
          <LinearGradient
            colors={["#2D1810", "#45271D"]}
            style={{ position: "absolute", inset: 0 }}
          />
          <View className="flex-row items-center gap-3.5">
            <Image
              source={{ uri: user.avatar }}
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                borderWidth: 2,
                borderColor: "#E86A17",
              }}
            />
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text
                  numberOfLines={1}
                  className="text-base font-black text-white"
                >
                  {user.name}
                </Text>
                <View className="px-2 py-0.5 rounded-full bg-[#E86A17]">
                  <Text className="text-[9px] font-extrabold text-white">
                    VIP Gold
                  </Text>
                </View>
              </View>
              <Text numberOfLines={1} className="text-xs text-amber-100/80">
                {user.email}
              </Text>
              <Text className="text-[10px] text-neutral-400">{user.phone}</Text>
            </View>
          </View>

          <View className="mt-3.5 pt-3 border-t border-white/15 flex-row gap-2">
            <View className="flex-1 bg-black/30 p-2 rounded-2xl items-center">
              <Text className="text-xs font-black text-amber-300">
                {user.loyaltyPoints} Points
              </Text>
              <Text className="text-[9px] text-neutral-300">
                Gourmet Rewards
              </Text>
            </View>
            <View className="flex-1 bg-black/30 p-2 rounded-2xl items-center">
              <Text className="text-xs font-black text-emerald-400">
                12 Orders
              </Text>
              <Text className="text-[9px] text-neutral-300">
                Total Completed
              </Text>
            </View>
          </View>
        </View>

        {/* 2. BACKEND BADGE */}
        <View className="p-3 bg-[#F4EFE6] rounded-2xl border border-[#613D2D]/15 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2 flex-1">
            <ShieldCheck width={16} height={16} color="#059669" />
            <View className="flex-1">
              <Text className="text-xs font-bold text-[#2D1810]">
                Appwrite Backend Architecture
              </Text>
              <Text className="text-[10px] text-[#8E7668]">
                Ready for production auth, database & realtime sync
              </Text>
            </View>
          </View>
          <View className="px-2 py-0.5 rounded-md bg-[#2D1810]">
            <Text className="text-white text-[9px] font-bold">Ready</Text>
          </View>
        </View>

        {/* 3. MENU SECTIONS */}
        {menuSections.map((section, idx) => (
          <View key={idx} className="gap-2">
            <Text className="text-xs font-extrabold text-[#8E7668] uppercase tracking-wider px-1">
              {section.label}
            </Text>

            <View className="bg-white rounded-3xl border border-[#613D2D]/12 overflow-hidden">
              {section.items.map((item, i) => {
                const isLast = i === section.items.length - 1;
                return (
                  <Pressable
                    key={item.id}
                    onPress={item.action}
                    className={`flex-row items-center justify-between p-3.5 ${
                      !isLast ? "border-b border-neutral-100" : ""
                    }`}
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <View className="w-8 h-8 rounded-xl bg-[#F4EFE6] items-center justify-center">
                        {item.icon}
                      </View>
                      <View className="flex-1">
                        <Text
                          numberOfLines={1}
                          className="text-xs font-bold text-[#2D1810]"
                        >
                          {item.title}
                        </Text>
                        <Text
                          numberOfLines={1}
                          className="text-[10px] text-[#8E7668]"
                        >
                          {item.subtitle}
                        </Text>
                      </View>
                    </View>

                    <ChevronRight width={16} height={16} color="#A3A3A3" />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {/* LOGOUT */}
        <Pressable
          onPress={() => {
            setIsAuthenticated(false);
            navigation.replace("/(auth)/login");
          }}
          className="flex-row items-center justify-center gap-2 p-3.5 rounded-2xl bg-white border border-red-200"
        >
          <LogOut width={16} height={16} color="#DC2626" />
          <Text className="text-red-600 text-xs font-bold">
            Sign Out Account
          </Text>
        </Pressable>
      </ScrollView>

      {/* DIETARY PREFERENCES MODAL */}
      <BottomSheet
        isOpen={isDietaryModalOpen}
        onClose={() => setIsDietaryModalOpen(false)}
        title="AI Taste & Dietary Preferences"
      >
        <View className="gap-3">
          <Text className="text-xs text-[#613D2D]">
            Shamsiya AI uses these preferences to curate food recommendations
            and scan evaluations:
          </Text>

          <View className="gap-2">
            {availableOptions.map((opt) => {
              const isChecked = selectedPreferences.includes(opt);
              return (
                <Pressable
                  key={opt}
                  onPress={() => togglePref(opt)}
                  className={`flex-row items-center justify-between p-3 rounded-2xl border ${
                    isChecked
                      ? "bg-[#FDFBF7] border-[#E86A17]"
                      : "bg-white border-[#613D2D]/15"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isChecked ? "text-[#2D1810]" : "text-[#8E7668]"
                    }`}
                  >
                    {opt}
                  </Text>
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
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={handleSaveDietary}
            className="mt-2 w-full py-2.5 rounded-xl bg-[#2D1810] items-center"
          >
            <Text className="text-white text-xs font-bold">
              Save Preferences
            </Text>
          </Pressable>
        </View>
      </BottomSheet>
    </View>
  );
}
