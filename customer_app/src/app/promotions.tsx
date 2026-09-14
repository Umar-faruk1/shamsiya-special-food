import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Copy, Megaphone, RefreshCw } from "lucide-react-native";
import { AppHeader } from "../components/AppHeader";
import { EmptyState } from "../components/CommonModalsAndCards";
import { getActivePromotions } from "../api/promotions";
import { Promotion } from "../types";

function money(value: number) {
  return `₵${Number(value).toFixed(2)}`;
}

export default function PromotionsScreen() {
  const router = useRouter();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setPromotions(await getActivePromotions());
    } catch (loadError) {
      console.error("Unable to load promotions:", loadError);
      setError("Unable to load promotions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const copyCode = async (code: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(code);
        Alert.alert("Copied", "Promo code copied");
      } else {
        Alert.alert("Promo code", `${code}\nEnter this code at checkout.`);
      }
    } catch (copyError) {
      console.error("Unable to copy promo code:", copyError);
      Alert.alert("Promo code", `${code}\nEnter this code at checkout.`);
    }
  };

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader currentScreen="Promotions" title="Promotions" showBack />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: 40,
          gap: 14,
        }}
      >
        {loading ? <ActivityIndicator size="large" color="#E86A17" /> : null}
        {error ? (
          <View className="items-center rounded-3xl bg-red-50 p-5">
            <Text className="text-xs text-red-800">{error}</Text>
            <Pressable
              onPress={() => void load()}
              className="mt-3 flex-row items-center gap-1"
            >
              <RefreshCw width={14} height={14} color="#B91C1C" />
              <Text className="text-xs font-bold text-red-700">Retry</Text>
            </Pressable>
          </View>
        ) : null}
        {!loading && !error && !promotions.length ? (
          <EmptyState
            icon={<Megaphone width={32} height={32} color="#E86A17" />}
            title="No promotions available"
            description="Check back later for special offers."
            actionText="Browse Menu"
            onAction={() => router.push("/(tabs)/explore")}
          />
        ) : null}
        {promotions.map((promotion) => (
          <View
            key={promotion.id}
            className="overflow-hidden rounded-3xl border border-[#E86A17]/25 bg-white"
          >
            {promotion.image_url ? (
              <Image
                source={{ uri: promotion.image_url }}
                style={{ width: "100%", height: 150 }}
                resizeMode="cover"
              />
            ) : null}
            <View className="gap-2 p-4">
              <Text className="text-base font-black text-[#2D1810]">
                {promotion.title}
              </Text>
              {promotion.description ? (
                <Text className="text-xs leading-relaxed text-[#613D2D]">
                  {promotion.description}
                </Text>
              ) : null}
              <Text className="text-lg font-black text-[#E86A17]">
                {promotion.discount_type === "percentage"
                  ? `${promotion.discount_value}% off`
                  : `${money(promotion.discount_value)} off`}
              </Text>
              {promotion.minimum_order && promotion.minimum_order > 0 ? (
                <Text className="text-[11px] text-[#8E7668]">
                  Minimum order: {money(promotion.minimum_order)}
                </Text>
              ) : null}
              {promotion.promo_code ? (
                <View className="flex-row items-center justify-between rounded-xl bg-[#F4EFE6] px-3 py-2">
                  <Text className="text-sm font-black tracking-wider text-[#2D1810]">
                    {promotion.promo_code}
                  </Text>
                  <Pressable
                    onPress={() =>
                      void copyCode(promotion.promo_code as string)
                    }
                    className="flex-row items-center gap-1"
                  >
                    <Copy width={14} height={14} color="#E86A17" />
                    <Text className="text-xs font-bold text-[#E86A17]">
                      Copy
                    </Text>
                  </Pressable>
                </View>
              ) : null}
              {promotion.end_date ? (
                <Text className="text-[10px] text-[#8E7668]">
                  Valid until{" "}
                  {new Date(promotion.end_date).toLocaleDateString()}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
