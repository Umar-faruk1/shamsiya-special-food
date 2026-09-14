import React from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronRight,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react-native";
import { FoodScanResult } from "../types";
import { PrimaryButton, SecondaryButton } from "../components/Buttons";
import { AppHeader } from "../components/AppHeader";
import { useApp } from "../context/AppContext";

export default function ScanResultsScreen() {
  const router = useRouter();
  const { latestScanResult: scanResult, handleAddToCartQuick } = useApp();

  if (!scanResult) {
    return (
      <View className="flex-1 bg-[#F7F4EE]">
        <AppHeader
          currentScreen="ScanResults"
          title="Food Recognition"
          showBack
        />
        <View className="flex-1 items-center justify-center p-8">
          <Camera width={32} height={32} color="#E86A17" />
          <Text className="mt-4 text-base font-extrabold text-[#2D1810]">
            No Scan Data Available
          </Text>
          <Text className="mt-1 mb-5 max-w-[240px] text-center text-xs text-[#8E7668]">
            Take a photo or choose an image to identify food.
          </Text>
          <PrimaryButton onPress={() => router.push("/food-scanner")}>
            Open Camera
          </PrimaryButton>
        </View>
      </View>
    );
  }

  const matchedFood = scanResult.matchedMenuDish;
  const matchedFoods =
    scanResult.matchedMenuItems ?? (matchedFood ? [matchedFood] : []);
  const confidence = Math.max(0, Math.min(100, scanResult.confidence));

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader
        currentScreen="ScanResults"
        title="Food Recognition"
        showBack
      />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: 40,
          gap: 16,
        }}
      >
        <View className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-neutral-900 border-2 border-[#613D2D]/15">
          <Image
            source={{ uri: scanResult.scannedImageUrl }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
          <View className="absolute left-3 top-3 rounded-full bg-black/65 px-3 py-1">
            <Text className="text-[10px] font-extrabold text-white">
              Scanned Photo
            </Text>
          </View>
        </View>

        {!scanResult.isFood ? (
          <View className="items-center gap-3 rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20">
              <AlertTriangle width={24} height={24} color="#BE123C" />
            </View>
            <Text className="text-base font-extrabold text-rose-950">
              Not Food
            </Text>
            <Text className="max-w-[280px] text-center text-xs leading-relaxed text-rose-800">
              {scanResult.message ||
                "This image is not food. Please scan a food item."}
            </Text>
          </View>
        ) : !matchedFoods.length ? (
          <View className="items-center gap-3 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20">
              <Sparkles width={24} height={24} color="#B45309" />
            </View>
            <Text className="text-base font-extrabold text-amber-950">
              Food Detected
            </Text>
            <Text className="text-xl font-extrabold text-[#E86A17]">
              {scanResult.recognizedDishName}
            </Text>
            <Text className="max-w-[280px] text-center text-xs leading-relaxed text-amber-900">
              {scanResult.message ||
                "This is food, but we couldn't find a matching item on the Shamsiya menu."}
            </Text>
          </View>
        ) : (
          <View className="gap-3 rounded-3xl border border-emerald-500/30 bg-white p-4">
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-[11px] font-black uppercase tracking-wider text-emerald-700">
                  Food Detected
                </Text>
                <Text className="mt-1 text-xl font-extrabold text-[#2D1810]">
                  {scanResult.recognizedDishName}
                </Text>
                <Text className="mt-1 text-xs text-[#8E7668]">
                  AI confidence: {confidence}%
                </Text>
              </View>
              <View className="flex-row items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1">
                <CheckCircle2 width={14} height={14} color="#059669" />
                <Text className="text-xs font-black text-emerald-700">
                  {confidence}%
                </Text>
              </View>
            </View>
            {confidence < 60 ? (
              <View className="rounded-2xl bg-amber-50 p-3">
                <Text className="text-xs font-bold text-amber-900">
                  Low confidence result
                </Text>
                <Text className="mt-1 text-xs text-amber-800">
                  Try taking a clearer photo with the food centered in the
                  frame.
                </Text>
              </View>
            ) : null}
            <Text className="text-xs leading-relaxed text-[#613D2D]">
              {scanResult.message}
            </Text>
            <Image
              source={{ uri: matchedFoods[0].image }}
              style={{ width: "100%", height: 170, borderRadius: 18 }}
              resizeMode="cover"
            />
            <View className="gap-1">
              <Text className="text-lg font-black text-[#E86A17]">
                GH₵{matchedFoods[0].price.toFixed(2)}
              </Text>
              {matchedFoods[0].description ? (
                <Text className="text-xs leading-relaxed text-[#8E7668]">
                  {matchedFoods[0].description}
                </Text>
              ) : null}
              {matchedFoods[0].prepTime ? (
                <Text className="text-xs font-bold text-[#613D2D]">
                  Preparation: {matchedFoods[0].prepTime}
                </Text>
              ) : null}
            </View>
            <View className="flex-row gap-2">
              <SecondaryButton
                fullWidth
                onPress={() =>
                  router.push({
                    pathname: "/food-details-modal",
                    params: { foodId: matchedFoods[0].id },
                  })
                }
                icon={<ChevronRight width={15} height={15} color="#2D1810" />}
              >
                View Food
              </SecondaryButton>
              <PrimaryButton
                fullWidth
                onPress={() => handleAddToCartQuick(matchedFoods[0])}
                icon={<Plus width={15} height={15} color="#fff" />}
              >
                Add to Cart
              </PrimaryButton>
            </View>
          </View>
        )}

        {scanResult.isFood && matchedFoods.length > 1 ? (
          <View className="gap-2 rounded-3xl border border-[#613D2D]/12 bg-white p-4">
            <Text className="text-xs font-extrabold uppercase tracking-wider text-[#2D1810]">
              Available at Shamsiya
            </Text>
            {matchedFoods.slice(1).map((food) => (
              <View
                key={food.id}
                className="gap-2 border-b border-neutral-100 py-3"
              >
                <View className="flex-row items-center gap-3">
                  <Image
                    source={{ uri: food.image }}
                    style={{ width: 64, height: 64, borderRadius: 14 }}
                    resizeMode="cover"
                  />
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-[#2D1810]">
                      {food.name}
                    </Text>
                    <Text className="mt-1 text-[10px] text-[#8E7668]">
                      {food.description}
                    </Text>
                    <Text className="mt-1 text-xs font-extrabold text-[#E86A17]">
                      GH₵{food.price.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-2">
                  <SecondaryButton
                    fullWidth
                    onPress={() =>
                      router.push({
                        pathname: "/food-details-modal",
                        params: { foodId: food.id },
                      })
                    }
                  >
                    View Food
                  </SecondaryButton>
                  <PrimaryButton
                    fullWidth
                    onPress={() => handleAddToCartQuick(food)}
                    icon={<Plus width={15} height={15} color="#fff" />}
                  >
                    Add to Cart
                  </PrimaryButton>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View className="gap-2">
          <PrimaryButton
            fullWidth
            onPress={() => router.push("/food-scanner")}
            icon={<RefreshCw width={16} height={16} color="#fff" />}
          >
            Scan Another Food
          </PrimaryButton>
          <SecondaryButton
            fullWidth
            onPress={() => router.push("/(tabs)/explore")}
            icon={<Camera width={16} height={16} color="#2D1810" />}
          >
            Browse Menu
          </SecondaryButton>
        </View>
      </ScrollView>
    </View>
  );
}
