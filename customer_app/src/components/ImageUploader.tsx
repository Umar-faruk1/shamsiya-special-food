import React, { useRef, useState } from "react";
import { View, Text, Image, Pressable, ActivityIndicator } from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Camera, Image as ImageIcon, RotateCcw, Sparkles, Zap, AlertCircle } from "lucide-react-native";
import { PrimaryButton, SecondaryButton } from "./Buttons";

interface ImageUploaderProps {
  onScanImage: (imageUri: string, hint?: string) => void;
  isScanning?: boolean;
}

const sampleScans = [
  {
    label: "Lamb Biryani",
    hint: "biryani",
    img: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80",
  },
  {
    label: "Grilled Suya",
    hint: "suya",
    img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=80",
  },
  {
    label: "Party Jollof",
    hint: "jollof",
    img: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=500&auto=format&fit=crop&q=80",
  },
  {
    label: "Butter Chicken",
    hint: "butter chicken",
    img: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=500&auto=format&fit=crop&q=80",
  },
  {
    label: "Golden Kunafa",
    hint: "kunafa",
    img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80",
  },
];

// Direct port of ImageUploader.tsx. The web version used getUserMedia +
// canvas snapshots; here we use expo-camera's CameraView + takePictureAsync,
// and expo-image-picker for the gallery flow.
export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onScanImage,
  isScanning = false,
}) => {
  const [activeMode, setActiveMode] = useState<"camera" | "gallery" | "samples">("camera");
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const ensurePermission = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      return res.granted;
    }
    return true;
  };

  const takeSnapshot = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
    if (photo?.uri) {
      setCapturedImage(photo.uri);
      onScanImage(photo.uri);
    }
  };

  const handlePickFromGallery = async () => {
    setActiveMode("gallery");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setCapturedImage(result.assets[0].uri);
      onScanImage(result.assets[0].uri);
    } else {
      setActiveMode("camera");
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setActiveMode("camera");
  };

  return (
    <View className="w-full gap-3">
      {/* MODE SWITCHER */}
      <View className="flex-row bg-[#F4EFE6] p-1 rounded-2xl border border-[#613D2D]/15">
        <Pressable
          onPress={() => {
            setCapturedImage(null);
            setActiveMode("camera");
          }}
          className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl ${
            activeMode === "camera" ? "bg-[#2D1810]" : ""
          }`}
        >
          <Camera width={14} height={14} color={activeMode === "camera" ? "#fff" : "#8E7668"} />
          <Text
            className={`text-xs font-bold ${
              activeMode === "camera" ? "text-white" : "text-[#8E7668]"
            }`}
          >
            Camera
          </Text>
        </Pressable>

        <Pressable
          onPress={handlePickFromGallery}
          className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl ${
            activeMode === "gallery" ? "bg-[#2D1810]" : ""
          }`}
        >
          <ImageIcon width={14} height={14} color={activeMode === "gallery" ? "#fff" : "#8E7668"} />
          <Text
            className={`text-xs font-bold ${
              activeMode === "gallery" ? "text-white" : "text-[#8E7668]"
            }`}
          >
            Gallery
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveMode("samples")}
          className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl ${
            activeMode === "samples" ? "bg-[#2D1810]" : ""
          }`}
        >
          <Sparkles width={14} height={14} color="#E86A17" />
          <Text
            className={`text-xs font-bold ${
              activeMode === "samples" ? "text-white" : "text-[#8E7668]"
            }`}
          >
            Samples
          </Text>
        </Pressable>
      </View>

      {/* VIEWPORT */}
      <View className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-neutral-900 border-2 border-[#613D2D]/20 items-center justify-center">
        {capturedImage ? (
          <View className="relative w-full h-full">
            <Image source={{ uri: capturedImage }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            {isScanning ? (
              <View className="absolute inset-0 bg-black/60 items-center justify-center gap-3">
                <ActivityIndicator size="large" color="#E86A17" />
                <View className="items-center">
                  <Text className="text-sm font-extrabold text-white tracking-wide">
                    Shamsiya AI Analyzing...
                  </Text>
                  <Text className="text-[11px] text-amber-200">
                    Detecting dish, spices & ingredients
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        ) : activeMode === "camera" ? (
          permission?.granted ? (
            <View className="relative w-full h-full">
              <CameraView ref={cameraRef} style={{ width: "100%", height: "100%" }} facing={facing} />

              <View className="absolute inset-0 items-center justify-between p-6" pointerEvents="box-none">
                <View className="bg-black/60 px-3 py-1 rounded-full flex-row items-center gap-1.5">
                  <Zap width={12} height={12} color="#E86A17" />
                  <Text className="text-[10px] font-extrabold text-amber-300">
                    AI Vision Scanner Active
                  </Text>
                </View>

                <View className="w-48 h-48 border-2 border-dashed border-amber-400/80 rounded-3xl items-center justify-center">
                  <Text className="text-[10px] text-white/70 font-semibold bg-black/40 px-2 py-0.5 rounded-md">
                    Frame Dish Here
                  </Text>
                </View>

                <Pressable
                  onPress={() => setFacing(facing === "back" ? "front" : "back")}
                  className="bg-black/60 p-2 rounded-full"
                  accessibilityLabel="Switch camera"
                >
                  <RotateCcw width={16} height={16} color="#fff" />
                </Pressable>
              </View>
            </View>
          ) : (
            <View className="p-4 items-center justify-center gap-2">
              <AlertCircle width={32} height={32} color="#E86A17" />
              <Text className="text-xs font-medium text-white text-center max-w-[260px]">
                Camera permission needed to scan food live.
              </Text>
              <Pressable
                onPress={ensurePermission}
                className="mt-2 px-3 py-1.5 rounded-xl bg-[#E86A17]"
              >
                <Text className="text-white text-xs font-bold">Grant Camera Access</Text>
              </Pressable>
            </View>
          )
        ) : (
          <View className="p-4 items-center justify-center gap-2">
            <AlertCircle width={32} height={32} color="#E86A17" />
            <Text className="text-xs font-medium text-white text-center max-w-[260px]">
              Select an image or choose one of our sample dishes
            </Text>
            <View className="flex-row gap-2 mt-2">
              <Pressable
                onPress={handlePickFromGallery}
                className="px-3 py-1.5 rounded-xl bg-[#E86A17]"
              >
                <Text className="text-white text-xs font-bold">Upload Photo</Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveMode("samples")}
                className="px-3 py-1.5 rounded-xl bg-white/20"
              >
                <Text className="text-white text-xs font-bold">Try Samples</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* CONTROLS */}
      {capturedImage ? (
        <SecondaryButton fullWidth onPress={handleRetake} icon={<RotateCcw width={16} height={16} color="#2D1810" />}>
          Retake Photo
        </SecondaryButton>
      ) : activeMode === "camera" && permission?.granted ? (
        <View className="items-center py-1">
          <PrimaryButton
            size="lg"
            fullWidth
            onPress={takeSnapshot}
            loading={isScanning}
            icon={<Camera width={20} height={20} color="#fff" strokeWidth={2.5} />}
          >
            Capture & Scan Food
          </PrimaryButton>
        </View>
      ) : null}

      {/* SAMPLES */}
      {activeMode === "samples" ? (
        <View className="gap-1.5 mt-1">
          <Text className="text-[11px] font-bold text-[#8E7668]">
            Instant Sample Dishes (Tap to analyze):
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {sampleScans.map((s, idx) => (
              <Pressable
                key={idx}
                onPress={() => {
                  setCapturedImage(s.img);
                  onScanImage(s.img, s.hint);
                }}
                style={{ width: "31%" }}
                className="bg-white p-2 rounded-2xl border border-[#613D2D]/15 items-center"
              >
                <Image
                  source={{ uri: s.img }}
                  style={{ width: "100%", aspectRatio: 1, borderRadius: 12, marginBottom: 4 }}
                />
                <Text numberOfLines={1} className="text-[10px] font-bold text-[#2D1810]">
                  {s.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
};
