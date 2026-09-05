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
import { Mail, Eye, EyeOff, ArrowRight, Check } from "lucide-react-native";
import { useRouter } from "expo-router";
import { PrimaryButton } from "../../components/Buttons";
import { useApp } from "../../context/AppContext";

const DUMMY_EMAIL = "umarfarukmahama@gmail.com";
const DUMMY_PASSWORD = "shamsiya123";

export default function LoginScreen() {
  const router = useRouter();
  const { setIsAuthenticated } = useApp();

  const [identifier, setIdentifier] = useState("umarfarukmahama@gmail.com");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!identifier.trim()) {
      setErrorMessage("Please enter your email or phone number.");
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Please enter your password.");
      return;
    }

    if (
      identifier.trim().toLowerCase() !== DUMMY_EMAIL ||
      password !== DUMMY_PASSWORD
    ) {
      setErrorMessage(
        `Use ${DUMMY_EMAIL} and ${DUMMY_PASSWORD} for the demo login.`,
      );
      return;
    }

    setErrorMessage(null);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsAuthenticated(true);
      router.replace("/(auth)/location-setup");
    }, 700);
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsAuthenticated(true);
      router.replace("/(auth)/location-setup");
    }, 600);
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
        <View className="gap-6">
          {/* Header Branding & Welcome */}
          <View className="gap-1.5 pt-2">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-xl bg-[#2D1810] items-center justify-center">
                <Text className="text-[#E86A17] font-black text-sm">SF</Text>
              </View>
              <Text className="text-xs font-black text-[#8E7668] uppercase tracking-wider">
                Shamsiya Special Food
              </Text>
            </View>

            <Text className="text-2xl font-black text-[#2D1810] mt-2">
              Welcome Back 👋
            </Text>
            <Text className="text-xs text-[#613D2D]">
              Sign in to access your saved cravings, favorites, and track live
              meals.
            </Text>
          </View>

          {/* Error Notification */}
          {errorMessage ? (
            <View className="p-3 bg-red-50 rounded-2xl border border-red-200">
              <Text className="text-red-700 text-xs font-medium">
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* Login Form */}
          <View className="gap-4">
            {/* Email / Phone Field */}
            <View className="gap-1.5">
              <Text className="text-xs font-bold text-[#2D1810]">
                Email or Phone Number
              </Text>
              <View className="relative flex-row items-center">
                <TextInput
                  value={identifier}
                  onChangeText={setIdentifier}
                  placeholder="name@example.com or +233..."
                  placeholderTextColor="rgba(142,118,104,0.6)"
                  autoCapitalize="none"
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-[#613D2D]/15 text-xs text-[#2D1810] font-medium pr-10"
                />
                <View className="absolute right-3.5">
                  <Mail width={16} height={16} color="#8E7668" />
                </View>
              </View>
            </View>

            {/* Password Field */}
            <View className="gap-1.5">
              <Text className="text-xs font-bold text-[#2D1810]">Password</Text>
              <View className="relative flex-row items-center">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor="rgba(142,118,104,0.6)"
                  secureTextEntry={!showPassword}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-[#613D2D]/15 text-xs text-[#2D1810] font-medium pr-10"
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-3 p-1"
                  accessibilityLabel={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff width={16} height={16} color="#8E7668" />
                  ) : (
                    <Eye width={16} height={16} color="#8E7668" />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Options: Remember me & Forgot Password */}
            <View className="flex-row items-center justify-between pt-0.5">
              <Pressable
                onPress={() => setRememberMe(!rememberMe)}
                className="flex-row items-center gap-2"
              >
                <View
                  className={`w-4 h-4 rounded-md items-center justify-center border ${
                    rememberMe
                      ? "bg-[#E86A17] border-[#E86A17]"
                      : "border-[#613D2D]/30"
                  }`}
                >
                  {rememberMe ? (
                    <Check width={11} height={11} color="#fff" />
                  ) : null}
                </View>
                <Text className="text-xs font-semibold text-[#613D2D]">
                  Remember me
                </Text>
              </Pressable>

              <Pressable onPress={() => router.push("/forgot-password")}>
                <Text className="text-xs font-bold text-[#E86A17]">
                  Forgot password?
                </Text>
              </Pressable>
            </View>

            {/* Submit Button */}
            <PrimaryButton
              size="lg"
              fullWidth
              loading={loading}
              onPress={handleSubmit}
              icon={
                <ArrowRight
                  width={16}
                  height={16}
                  color="#fff"
                  strokeWidth={2.5}
                />
              }
            >
              Login
            </PrimaryButton>
          </View>

          {/* Divider */}
          <View className="relative items-center justify-center py-1">
            <View className="w-full border-t border-[#613D2D]/15" />
            <View className="absolute bg-[#FDFBF7] px-3">
              <Text className="text-[11px] font-black uppercase tracking-wider text-[#8E7668]">
                OR
              </Text>
            </View>
          </View>

          {/* Social Login: Google */}
          <Pressable
            onPress={handleGoogleLogin}
            className="w-full py-3 px-4 rounded-2xl bg-white border border-[#613D2D]/15 flex-row items-center justify-center gap-2.5 active:opacity-80"
          >
            <View className="w-4 h-4 rounded-full bg-[#4285F4] items-center justify-center">
              <Text className="text-white text-[9px] font-black">G</Text>
            </View>
            <Text className="text-xs font-black text-[#2D1810]">
              Continue with Google
            </Text>
          </Pressable>
        </View>

        {/* Footer: Create Account Link */}
        <View className="pt-6 pb-2 items-center">
          <View className="flex-row">
            <Text className="text-xs text-[#613D2D] font-medium">
              Don't have an account?{" "}
            </Text>
            <Pressable onPress={() => router.push("/register")}>
              <Text className="text-xs font-black text-[#E86A17]">Sign up</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
