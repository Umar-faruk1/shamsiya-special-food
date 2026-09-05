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
import { Mail, ArrowLeft, Send, CheckCircle2 } from "lucide-react-native";
import { useRouter } from "expo-router";
import { PrimaryButton } from "../../components/Buttons";


export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!identifier.trim()) {
      setError("Please enter your email or phone number.");
      return;
    }
    setError(null);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSentSuccess(true);
    }, 700);
  };

  const handleBackToLogin = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(auth)/login");
    }
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
          {/* Back navigation */}
          <View className="flex-row items-center gap-2 pt-1">
            <Pressable
              onPress={handleBackToLogin}
              className="w-8 h-8 rounded-full bg-[#F4EFE6] items-center justify-center"
              accessibilityLabel="Back to login"
            >
              <ArrowLeft width={16} height={16} color="#2D1810" />
            </Pressable>
            <Text className="text-xs font-bold text-[#8E7668]">
              Back to Login
            </Text>
          </View>

          {/* Title and description */}
          <View className="gap-1.5">
            <Text className="text-2xl font-black text-[#2D1810]">
              Reset Your Password
            </Text>
            <Text className="text-xs text-[#613D2D] leading-relaxed">
              Enter your email or phone number and we'll help you reset your
              password.
            </Text>
          </View>

          {sentSuccess ? (
            <View className="items-center p-6 bg-white rounded-3xl border border-[#613D2D]/12 gap-3 my-2">
              <View className="w-12 h-12 rounded-2xl bg-emerald-100 items-center justify-center">
                <CheckCircle2 width={24} height={24} color="#047857" />
              </View>
              <Text className="text-sm font-black text-[#2D1810]">
                Reset Link Sent!
              </Text>
              <Text className="text-xs text-[#8E7668] text-center leading-relaxed max-w-[240px]">
                We have sent recovery instructions to{" "}
                <Text className="text-[#2D1810] font-bold">{identifier}</Text>.
              </Text>
              <View className="pt-2 w-full">
                <PrimaryButton fullWidth size="md" onPress={handleBackToLogin}>
                  Return to Login
                </PrimaryButton>
              </View>
            </View>
          ) : (
            <View className="gap-4">
              {error ? (
                <View className="p-3 bg-red-50 rounded-2xl border border-red-200">
                  <Text className="text-red-700 text-xs font-medium">
                    {error}
                  </Text>
                </View>
              ) : null}

              <View className="gap-1.5">
                <Text className="text-xs font-bold text-[#2D1810]">
                  Email or Phone Number
                </Text>
                <View className="relative flex-row items-center">
                  <TextInput
                    value={identifier}
                    onChangeText={setIdentifier}
                    placeholder="e.g. name@example.com or +233..."
                    placeholderTextColor="rgba(142,118,104,0.6)"
                    autoCapitalize="none"
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-[#613D2D]/15 text-xs text-[#2D1810] font-medium pr-10"
                  />
                  <View className="absolute right-3.5">
                    <Mail width={16} height={16} color="#8E7668" />
                  </View>
                </View>
              </View>

              <View className="pt-2">
                <PrimaryButton
                  size="lg"
                  fullWidth
                  loading={loading}
                  onPress={handleSubmit}
                  icon={<Send width={16} height={16} color="#fff" />}
                >
                  Send Reset Link
                </PrimaryButton>
              </View>
            </View>
          )}
        </View>

        <View className="pt-6 pb-2 items-center">
          <View className="flex-row">
            <Text className="text-xs text-[#613D2D]">
              Remember your password?{" "}
            </Text>
            <Pressable onPress={handleBackToLogin}>
              <Text className="text-xs font-black text-[#E86A17]">Login</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
