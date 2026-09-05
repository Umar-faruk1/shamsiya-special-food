import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  MapPin,
  Navigation,
  Edit3,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Building,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { UserAddress } from "../../types";
import { PrimaryButton } from "../../components/Buttons";
import { useApp } from "../../context/AppContext";

export default function LocationSetupScreen() {
  const router = useRouter();
  const { handleAddAddress } = useApp();

  const [mode, setMode] = useState<"choose" | "manual">("choose");
  const [isDetecting, setIsDetecting] = useState(false);

  const [street, setStreet] = useState("14 Independence Avenue");
  const [area, setArea] = useState("Airport Residential Area");
  const [city, setCity] = useState("Accra");
  const [label, setLabel] = useState<"Home" | "Work" | "Other">("Home");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleUseCurrentLocation = () => {
    setIsDetecting(true);
    setTimeout(() => {
      setIsDetecting(false);
      setStreet("24 Ring Road Central, Suite 3B");
      setArea("Cantonments");
      setCity("Accra");
      setMode("manual");
    }, 850);
  };

  const handleSaveAddress = () => {
    const newAddress: UserAddress = {
      id: `addr-${Date.now()}`,
      label,
      recipientName: "Umar Faruk Mahama",
      street: street || "14 Independence Avenue",
      apartment: area,
      city: city || "Accra",
      postalCode: "GA-110",
      phone: "+233 24 555 0192",
      isDefault: true,
    };

    setSavedSuccess(true);
    handleAddAddress(newAddress);
    setTimeout(() => {
      router.replace("/");
    }, 700);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-[#FDFBF7]"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between" }}
        className="p-5"
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-5">
          {/* Header Visual */}
          <View className="items-center gap-2 pt-2">
            <LinearGradient
              colors={["#E86A17", "#FFA028"]}
              style={{
                width: 64,
                height: 64,
                borderRadius: 24,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 4,
              }}
            >
              <MapPin width={32} height={32} color="#fff" />
            </LinearGradient>

            <Text className="text-2xl font-black text-[#2D1810] text-center max-w-[260px]">
              Where should we deliver your food?
            </Text>
            <Text className="text-xs text-[#613D2D] text-center leading-relaxed max-w-[280px]">
              Set your delivery address so we can show you nearby Shamsiya
              kitchens and accurate delivery times.
            </Text>
          </View>

          {/* Buttons / Options */}
          {mode === "choose" ? (
            <View className="gap-3 pt-3">
              {/* Use Current Location Button */}
              <Pressable
                onPress={handleUseCurrentLocation}
                disabled={isDetecting}
                className="p-4 rounded-3xl bg-[#2D1810] flex-row items-center justify-between active:opacity-90"
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="w-10 h-10 rounded-2xl bg-[#E86A17] items-center justify-center">
                    <Navigation
                      width={20}
                      height={20}
                      color="#fff"
                      fill="#fff"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-extrabold text-white">
                      {isDetecting
                        ? "Detecting GPS location..."
                        : "Use Current Location"}
                    </Text>
                    <Text className="text-[11px] text-amber-200/90 font-medium">
                      Fastest setup via device GPS
                    </Text>
                  </View>
                </View>
                <ArrowRight width={16} height={16} color="#D4D4D4" />
              </Pressable>

              {/* Enter Address Manually */}
              <Pressable
                onPress={() => setMode("manual")}
                className="p-4 rounded-3xl bg-white border border-[#613D2D]/15 flex-row items-center justify-between active:opacity-90"
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="w-10 h-10 rounded-2xl bg-[#F4EFE6] items-center justify-center">
                    <Edit3 width={20} height={20} color="#E86A17" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-extrabold text-[#2D1810]">
                      Enter Address Manually
                    </Text>
                    <Text className="text-[11px] text-[#8E7668] font-medium">
                      Type your street, area, and city
                    </Text>
                  </View>
                </View>
                <ArrowRight width={16} height={16} color="#8E7668" />
              </Pressable>
            </View>
          ) : (
            /* Address Card & Manual Input */
            <View className="gap-3.5 bg-white p-4 rounded-3xl border border-[#613D2D]/12">
              <View className="flex-row items-center justify-between pb-1 border-b border-[#613D2D]/10">
                <View className="flex-row items-center gap-1.5">
                  <Building width={14} height={14} color="#E86A17" />
                  <Text className="text-xs font-black text-[#2D1810] uppercase tracking-wider">
                    Delivery Address Card
                  </Text>
                </View>
                <Pressable onPress={() => setMode("choose")}>
                  <Text className="text-[11px] font-bold text-[#E86A17]">
                    Change Method
                  </Text>
                </Pressable>
              </View>

              {/* Address Type Pill */}
              <View className="flex-row items-center gap-2">
                {(["Home", "Work", "Other"] as const).map((lbl) => (
                  <Pressable
                    key={lbl}
                    onPress={() => setLabel(lbl)}
                    className={`px-3 py-1 rounded-xl ${
                      label === lbl ? "bg-[#2D1810]" : "bg-[#F4EFE6]"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        label === lbl ? "text-white" : "text-[#2D1810]"
                      }`}
                    >
                      {lbl}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Street */}
              <View className="gap-1">
                <Text className="text-[11px] font-bold text-[#613D2D]">
                  Street Name & House / Door No.
                </Text>
                <TextInput
                  value={street}
                  onChangeText={setStreet}
                  placeholder="e.g. 14 Independence Avenue"
                  placeholderTextColor="rgba(142,118,104,0.6)"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FDFBF7] border border-[#613D2D]/15 text-xs text-[#2D1810] font-medium"
                />
              </View>

              {/* Area */}
              <View className="gap-1">
                <Text className="text-[11px] font-bold text-[#613D2D]">
                  Area / Landmark / Neighborhood
                </Text>
                <TextInput
                  value={area}
                  onChangeText={setArea}
                  placeholder="e.g. Airport Residential Area"
                  placeholderTextColor="rgba(142,118,104,0.6)"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FDFBF7] border border-[#613D2D]/15 text-xs text-[#2D1810] font-medium"
                />
              </View>

              {/* City */}
              <View className="gap-1">
                <Text className="text-[11px] font-bold text-[#613D2D]">
                  City
                </Text>
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. Accra"
                  placeholderTextColor="rgba(142,118,104,0.6)"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FDFBF7] border border-[#613D2D]/15 text-xs text-[#2D1810] font-medium"
                />
              </View>

              {/* Save Address Button */}
              <View className="pt-2">
                <PrimaryButton
                  size="lg"
                  fullWidth
                  onPress={handleSaveAddress}
                  icon={<CheckCircle2 width={16} height={16} color="#fff" />}
                >
                  {savedSuccess ? "Saving Address..." : "Save Address"}
                </PrimaryButton>
              </View>
            </View>
          )}
        </View>

        {/* Footer hint */}
        <View className="pt-4 pb-2 items-center">
          <View className="flex-row items-center gap-1">
            <ShieldCheck width={14} height={14} color="#059669" />
            <Text className="text-[11px] text-[#8E7668] font-medium">
              You can edit or add multiple addresses anytime in Profile
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
