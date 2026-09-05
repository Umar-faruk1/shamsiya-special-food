import React, { useState, useRef } from "react";
import { View, Text, Image, Pressable, Modal, ScrollView } from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  Camera,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  History,
  ArrowLeft,
  X,
  Check,
  Clock,
  ChevronRight,
  RefreshCw,
} from "lucide-react-native";
import { FoodItem, FoodScanResult } from "../types";
import { useApp } from "../context/AppContext";
import { sendAIFoodScan } from "../api/aiClient";

const analysisSteps = [
  "Detecting food",
  "Analyzing image",
  "Finding matching meals",
];

// Direct port of FoodScannerScreen.tsx. getUserMedia/canvas capture becomes
// expo-camera's CameraView + takePictureAsync; gallery uses expo-image-picker.
// The web's fetch("/api/ai/recognize-food") call is routed through your
// backend per the requested architecture — dispatchFallbackResult below
// simulates it until that endpoint is wired up.
export default function FoodScannerScreen() {
  const navigation = useRouter();
  const { foodItems, recentScans, handleScanCompleted } = useApp();

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [scanState, setScanState] = useState<
    "viewfinder" | "preview" | "analyzing"
  >("viewfinder");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const cameraRef = useRef<CameraView>(null);

  const handleCaptureShutter = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
    if (photo?.uri) {
      setCapturedImage(photo.uri);
      setScanState("preview");
    }
  };

  const handleOpenGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setCapturedImage(result.assets[0].uri);
      setScanState("preview");
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setScanState("viewfinder");
    setAnalyzingStep(0);
  };

  const dispatchFallbackResult = () => {
    const matched = foodItems[0];
    const scanResult: FoodScanResult = {
      id: `scan-${Date.now()}`,
      timestamp: "Today, Just now",
      scannedImageUrl:
        capturedImage ||
        "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
      recognizedDishName: "Jollof Rice",
      confidence: 94,
      detectedCuisine: "West African Special",
      description:
        "Authentic woodfire recipe simmered in rich tomato pepper base with spices and caramelized plantains.",
      detectedIngredients: [
        "Long-grain Rice",
        "Plum Tomato Sauce",
        "Scotch Bonnet Pepper",
        "Thyme & Curry",
      ],
      nutritionEstimate: {
        calories: 610,
        protein: "32g",
        carbs: "76g",
        fat: "17g",
      },
      flavorProfile: ["Woodsmoke", "Savory Peppery", "Sweet Tangy"],
      matchedMenuDish: matched,
      matchPercentage: 94,
      alternativeMatches: [
        { dish: foodItems[1] || foodItems[0], matchPercentage: 89 },
        { dish: foodItems[2] || foodItems[0], matchPercentage: 82 },
      ],
    };
    handleScanCompleted(scanResult, () => navigation.push("/scan-result"));
  };

  const handleAnalyzeFood = async () => {
    if (!capturedImage) return;
    setScanState("analyzing");
    setAnalyzingStep(0);

    setTimeout(() => setAnalyzingStep(1), 700);
    setTimeout(() => setAnalyzingStep(2), 1400);

    // Routed through the app's own backend (see src/api/aiClient.ts), which
    // proxies to Gemini vision rather than calling it directly from the client.
    try {
      const resData = await sendAIFoodScan(capturedImage);
      if (resData?.success && resData.data) {
        const raw = resData.data;
        const matched =
          foodItems.find((f) => f.id === raw.matchedMenuDishId) ||
          foodItems.find((f) =>
            f.name
              .toLowerCase()
              .includes((raw.recognizedDishName || "").toLowerCase()),
          ) ||
          foodItems[0];

        const scanResult: FoodScanResult = {
          id: `scan-${Date.now()}`,
          timestamp: "Today, Just now",
          scannedImageUrl: capturedImage,
          recognizedDishName: raw.recognizedDishName || "Jollof Rice",
          confidence: raw.confidence || 94,
          detectedCuisine: raw.detectedCuisine || "West African Heritage",
          description:
            raw.description ||
            "Smoky woodfire fragrant rice in a rich tomato base.",
          detectedIngredients: raw.detectedIngredients || [
            "Rice",
            "Tomato",
            "Spices",
          ],
          nutritionEstimate: raw.nutritionEstimate || {
            calories: 610,
            protein: "32g",
            carbs: "76g",
            fat: "17g",
          },
          flavorProfile: raw.flavorProfile || [
            "Smoky",
            "Rich Spiced",
            "Tomato Savory",
          ],
          matchedMenuDish: matched,
          matchPercentage: raw.matchPercentage || 94,
          alternativeMatches: [
            { dish: foodItems[2] || foodItems[1], matchPercentage: 88 },
            { dish: foodItems[3] || foodItems[0], matchPercentage: 82 },
          ],
        };

        setTimeout(() => {
          handleScanCompleted(scanResult, () =>
            navigation.push("/scan-result"),
          );
        }, 2100);
      } else {
        setTimeout(dispatchFallbackResult, 2100);
      }
    } catch (err) {
      // Backend not reachable yet — fall back to a realistic mock result.
      setTimeout(dispatchFallbackResult, 2100);
    }
  };

  const onSelectRecentScan = (scan: FoodScanResult) => {
    setShowHistoryModal(false);
    handleScanCompleted(scan, () => navigation.push("/scan-result"));
  };

  return (
    <View className="flex-1 bg-[#1A0E0A]">
      {/* HEADER */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-[#1A0E0A]/95 border-b border-white/10">
        <Pressable
          onPress={() => navigation.push("/")}
          className="w-10 h-10 rounded-2xl bg-white/10 items-center justify-center"
          accessibilityLabel="Go back to Home"
        >
          <ArrowLeft width={20} height={20} color="#fff" />
        </Pressable>

        <View className="items-center">
          <View className="flex-row items-center gap-1.5">
            <Sparkles width={14} height={14} color="#E86A17" />
            <Text className="text-base font-extrabold text-white">
              Scan Food
            </Text>
          </View>
          <Text className="text-[10px] text-amber-200/80 font-medium">
            AI Food Recognition
          </Text>
        </View>

        <Pressable
          onPress={() => setShowHistoryModal(true)}
          className="relative w-10 h-10 rounded-2xl bg-white/10 items-center justify-center"
          accessibilityLabel="View recent scans history"
        >
          <History width={20} height={20} color="#FCD34D" />
          {recentScans && recentScans.length > 0 ? (
            <View className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E86A17] border-2 border-[#1A0E0A] items-center justify-center">
              <Text className="text-white text-[9px] font-black">
                {recentScans.length}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {/* VIEWPORT */}
      <View className="flex-1 bg-black items-center justify-center overflow-hidden">
        {scanState === "viewfinder" ? (
          permission?.granted ? (
            <View className="relative w-full h-full">
              <CameraView
                ref={cameraRef}
                style={{ width: "100%", height: "100%" }}
                facing={facing}
              />

              <View
                className="absolute inset-0 items-center justify-between p-6"
                pointerEvents="box-none"
              >
                <View className="bg-black/60 px-4 py-2 rounded-full border border-white/20 items-center">
                  <View className="flex-row items-center gap-1.5">
                    <Sparkles width={14} height={14} color="#E86A17" />
                    <Text className="text-xs font-extrabold text-amber-300">
                      AI Food Recognition
                    </Text>
                  </View>
                  <Text className="text-[10px] text-white/90 font-medium mt-0.5">
                    Point your camera at a food.
                  </Text>
                </View>

                <View className="w-64 h-64 rounded-[32px] border-2 border-dashed border-amber-400/70 items-center justify-center bg-black/15">
                  <View className="bg-black/70 px-3.5 py-1.5 rounded-xl border border-white/20">
                    <Text className="text-[11px] font-extrabold text-white text-center max-w-[200px]">
                      Place the food inside the frame
                    </Text>
                  </View>
                </View>

                <View className="bg-black/50 px-3 py-1 rounded-full">
                  <Text className="text-[10px] text-amber-200/90 font-medium">
                    🍲 Works with Jollof, Biryani, Shawarma, Soups & Grills
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View
              className="items-center justify-center p-6"
              style={{ maxWidth: 320 }}
            >
              <View className="w-16 h-16 rounded-3xl bg-[#E86A17]/20 border border-[#E86A17]/40 items-center justify-center mb-4">
                <Camera width={32} height={32} color="#E86A17" />
              </View>

              <Text className="text-lg font-extrabold text-white mb-1 text-center">
                Camera Access Needed
              </Text>
              <Text className="text-xs text-neutral-300 mb-6 leading-relaxed text-center">
                We need access to your camera to identify food, detect culinary
                ingredients, and match Shamsiya menu items.
              </Text>

              <View className="gap-2.5 w-full">
                <Pressable
                  onPress={requestPermission}
                  className="w-full py-3 px-4 rounded-2xl bg-[#E86A17] flex-row items-center justify-center gap-2"
                >
                  <Camera width={16} height={16} color="#fff" />
                  <Text className="text-white font-extrabold text-xs">
                    Allow Camera
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleOpenGallery}
                  className="w-full py-3 px-4 rounded-2xl bg-white/15 border border-white/20 flex-row items-center justify-center gap-2"
                >
                  <ImageIcon width={16} height={16} color="#FCD34D" />
                  <Text className="text-white font-extrabold text-xs">
                    Choose From Gallery
                  </Text>
                </Pressable>
              </View>
            </View>
          )
        ) : scanState === "preview" && capturedImage ? (
          <View className="relative w-full h-full bg-black">
            <Image
              source={{ uri: capturedImage }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />

            <View className="absolute top-4 left-4 right-4 flex-row items-center justify-between">
              <View className="bg-black/70 px-3 py-1 rounded-full border border-white/20">
                <Text className="text-xs font-extrabold text-white">
                  Photo Captured
                </Text>
              </View>
              <Pressable
                onPress={handleRetake}
                className="w-9 h-9 rounded-full bg-black/70 border border-white/20 items-center justify-center"
                accessibilityLabel="Close preview"
              >
                <X width={16} height={16} color="#fff" />
              </Pressable>
            </View>

            <View className="absolute bottom-0 left-0 right-0 p-5 gap-2.5">
              <Pressable
                onPress={handleAnalyzeFood}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#E86A17] flex-row items-center justify-center gap-2"
              >
                <Sparkles width={16} height={16} color="#fff" />
                <Text className="text-white font-black text-sm">
                  Use This Photo (Analyze Food)
                </Text>
              </Pressable>

              <Pressable
                onPress={handleRetake}
                className="w-full py-2.5 px-4 rounded-2xl bg-white/15 border border-white/20 flex-row items-center justify-center gap-2"
              >
                <RotateCcw width={14} height={14} color="#fff" />
                <Text className="text-white font-bold text-xs">Retake</Text>
              </Pressable>
            </View>
          </View>
        ) : scanState === "analyzing" && capturedImage ? (
          <View className="relative w-full h-full items-center justify-center p-6">
            <Image
              source={{ uri: capturedImage }}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                opacity: 0.35,
              }}
              resizeMode="cover"
            />

            <View className="items-center" style={{ maxWidth: 300 }}>
              <View className="w-12 h-12 rounded-full bg-[#E86A17] items-center justify-center mb-5">
                <Sparkles width={24} height={24} color="#fff" />
              </View>

              <Text className="text-base font-extrabold text-white text-center mb-1">
                Shamsiya AI is analyzing your food...
              </Text>
              <Text className="text-xs text-amber-200/90 font-medium mb-6 text-center">
                Matching visual features with authentic kitchen recipes
              </Text>

              <View className="w-full gap-2.5 bg-black/60 p-4 rounded-3xl border border-white/15">
                {analysisSteps.map((step, idx) => {
                  const isDone = analyzingStep > idx;
                  const isCurrent = analyzingStep === idx;
                  return (
                    <View key={idx} className="flex-row items-center gap-3">
                      <View
                        className={`w-5 h-5 rounded-full items-center justify-center ${
                          isDone
                            ? "bg-emerald-500"
                            : isCurrent
                              ? "bg-[#E86A17]"
                              : "bg-white/15"
                        }`}
                      >
                        {isDone ? (
                          <Check width={12} height={12} color="#fff" />
                        ) : isCurrent ? (
                          <RefreshCw width={10} height={10} color="#fff" />
                        ) : (
                          <Text className="text-white/40 text-[10px]">
                            {idx + 1}
                          </Text>
                        )}
                      </View>
                      <Text
                        className={`flex-1 text-xs font-bold ${
                          isDone
                            ? "text-emerald-400"
                            : isCurrent
                              ? "text-amber-300"
                              : "text-white/40"
                        }`}
                      >
                        {step}
                      </Text>
                      {isDone ? (
                        <Text className="text-[10px] text-emerald-400">
                          Done
                        </Text>
                      ) : isCurrent ? (
                        <Text className="text-[10px] text-amber-300">
                          Scanning...
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        ) : null}
      </View>

      {/* CONTROLS BAR */}
      {scanState === "viewfinder" && permission?.granted ? (
        <View className="flex-row items-center justify-between px-8 py-5 bg-[#1A0E0A] border-t border-white/10">
          <Pressable
            onPress={handleOpenGallery}
            className="items-center gap-1"
            accessibilityLabel="Open photo gallery"
          >
            <View className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 items-center justify-center">
              <ImageIcon width={20} height={20} color="#fff" />
            </View>
            <Text className="text-[11px] font-bold text-neutral-300">
              Gallery
            </Text>
          </Pressable>

          <Pressable
            onPress={handleCaptureShutter}
            className="p-1.5 rounded-full bg-[#E86A17]"
            accessibilityLabel="Capture food image"
          >
            <View className="w-16 h-16 rounded-full border-[3px] border-white/80 items-center justify-center bg-[#E86A17]">
              <View className="w-12 h-12 rounded-full bg-white items-center justify-center">
                <View className="w-9 h-9 rounded-full bg-[#E86A17] items-center justify-center">
                  <Camera width={20} height={20} color="#fff" />
                </View>
              </View>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setFacing(facing === "back" ? "front" : "back")}
            className="items-center gap-1"
            accessibilityLabel="Flip camera direction"
          >
            <View className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 items-center justify-center">
              <RotateCcw width={20} height={20} color="#fff" />
            </View>
            <Text className="text-[11px] font-bold text-neutral-300">Flip</Text>
          </Pressable>
        </View>
      ) : null}

      {/* RECENT SCANS MODAL */}
      <Modal
        visible={showHistoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <Pressable
          onPress={() => setShowHistoryModal(false)}
          className="flex-1 justify-end bg-black/70"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full bg-[#FDFBF7] rounded-t-[36px] p-5"
            style={{ maxHeight: "80%" }}
          >
            <View className="flex-row items-center justify-between border-b border-[#613D2D]/10 pb-3">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-xl bg-[#E86A17] items-center justify-center">
                  <History width={16} height={16} color="#fff" />
                </View>
                <View>
                  <Text className="text-base font-extrabold text-[#2D1810]">
                    Recent Scans
                  </Text>
                  <Text className="text-[11px] text-[#8E7668]">
                    Your identified culinary dishes
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => setShowHistoryModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-200 items-center justify-center"
              >
                <X width={16} height={16} color="#404040" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ gap: 10, paddingTop: 16 }}>
              {recentScans && recentScans.length > 0 ? (
                recentScans.map((scan) => (
                  <Pressable
                    key={scan.id}
                    onPress={() => onSelectRecentScan(scan)}
                    className="p-3 bg-white rounded-2xl border border-[#613D2D]/12 flex-row items-center justify-between gap-3"
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <Image
                        source={{ uri: scan.scannedImageUrl }}
                        style={{ width: 52, height: 52, borderRadius: 12 }}
                      />
                      <View className="flex-1">
                        <View className="flex-row items-center gap-1.5">
                          <Text
                            numberOfLines={1}
                            className="text-xs font-bold text-[#2D1810] flex-1"
                          >
                            {scan.recognizedDishName}
                          </Text>
                          <View className="px-1.5 py-0.5 rounded-md bg-emerald-50">
                            <Text className="text-[9px] font-extrabold text-emerald-700">
                              {scan.confidence}%
                            </Text>
                          </View>
                        </View>
                        <Text
                          numberOfLines={1}
                          className="text-[11px] text-[#8E7668] mt-0.5"
                        >
                          Matched to: {scan.matchedMenuDish.name}
                        </Text>
                        <View className="flex-row items-center gap-1 mt-0.5">
                          <Clock width={10} height={10} color="#A3A3A3" />
                          <Text className="text-[10px] text-neutral-400">
                            {scan.timestamp}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <ChevronRight width={16} height={16} color="#A3A3A3" />
                  </Pressable>
                ))
              ) : (
                <View className="py-8 items-center">
                  <Text className="text-xs text-[#8E7668] text-center">
                    No past food scans yet. Take a photo of any food to get
                    started!
                  </Text>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
