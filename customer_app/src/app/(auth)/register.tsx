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
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { PrimaryButton } from "../../components/Buttons";
import { useApp } from "../../context/AppContext";

export default function RegisterScreen() {
  const router = useRouter();
  const { setIsAuthenticated, setUser } = useApp();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password) {
      setErrorMessage("Please fill out all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (!agreedToTerms) {
      setErrorMessage("Please agree to the Terms & Privacy Policy.");
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setUser((prev) => ({ ...prev, name: fullName, email, phone }));
      setIsAuthenticated(true);
      router.replace("/(auth)/login");
    }, 750);
  };

  const Field = ({
    label,
    value,
    onChangeText,
    placeholder,
    icon: Icon,
    secure,
    keyboardType,
    rightAction,
  }: {
    label: string;
    value: string;
    onChangeText: (t: string) => void;
    placeholder: string;
    icon: any;
    secure?: boolean;
    keyboardType?: "default" | "email-address" | "phone-pad";
    rightAction?: React.ReactNode;
  }) => (
    <View className="gap-1">
      <Text className="text-xs font-bold text-[#2D1810]">{label}</Text>
      <View className="relative flex-row items-center">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(142,118,104,0.6)"
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize="none"
          className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#613D2D]/15 text-xs text-[#2D1810] font-medium pr-10"
        />
        <View className="absolute right-3.5">
          {rightAction || <Icon width={16} height={16} color="#8E7668" />}
        </View>
      </View>
    </View>
  );

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
          {/* Header */}
          <View className="gap-1 pt-1">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-xl bg-[#2D1810] items-center justify-center">
                <Text className="text-[#E86A17] font-black text-sm">SF</Text>
              </View>
              <Text className="text-xs font-black text-[#8E7668] uppercase tracking-wider">
                Shamsiya Special Food
              </Text>
            </View>

            <Text className="text-2xl font-black text-[#2D1810] mt-2">
              Create Your Account
            </Text>
            <Text className="text-xs text-[#613D2D]">
              Join thousands enjoying fresh aromatic meals delivered hot.
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

          {/* Form */}
          <View className="gap-3.5">
            <Field
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="e.g. Umar Faruk Mahama"
              icon={User}
            />
            <Field
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              icon={Mail}
              keyboardType="email-address"
            />
            <Field
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="+233 24 000 0000"
              icon={Phone}
              keyboardType="phone-pad"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create strong password"
              icon={Lock}
              secure={!showPassword}
              rightAction={
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
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
              }
            />
            <Field
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat password"
              icon={Lock}
              secure={!showPassword}
            />

            {/* Terms Checkbox */}
            <Pressable
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              className="flex-row items-start gap-2.5 pt-1"
            >
              <View
                className={`mt-0.5 w-4 h-4 rounded-md items-center justify-center border ${
                  agreedToTerms
                    ? "bg-[#E86A17] border-[#E86A17]"
                    : "border-[#613D2D]/30"
                }`}
              >
                {agreedToTerms ? (
                  <Check width={11} height={11} color="#fff" />
                ) : null}
              </View>
              <Text className="text-xs text-[#613D2D] leading-snug flex-1">
                I agree to the{" "}
                <Text className="font-bold text-[#2D1810] underline">
                  Terms of Service
                </Text>{" "}
                &{" "}
                <Text className="font-bold text-[#2D1810] underline">
                  Privacy Policy
                </Text>
              </Text>
            </Pressable>

            {/* Submit */}
            <View className="pt-2">
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
                Create Account
              </PrimaryButton>
            </View>
          </View>
        </View>

        {/* Footer link */}
        <View className="pt-5 pb-2 items-center">
          <View className="flex-row">
            <Text className="text-xs text-[#613D2D] font-medium">
              Already have an account?{" "}
            </Text>
            <Pressable onPress={() => router.push("/(auth)/login")}>
              <Text className="text-xs font-black text-[#E86A17]">Login</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
