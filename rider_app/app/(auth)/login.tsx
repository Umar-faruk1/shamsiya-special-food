import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { loading, session, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setError(null);
    const signInError = await signIn(email, password);
    if (signInError) {
      setError(signInError);
      return;
    }
    router.replace("/dashboard");
  }

  if (session && !loading) return <Redirect href="/dashboard" />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.brand}>Shamsiya Special Food</Text>
        <Text style={styles.title}>Rider App</Text>

        <View style={styles.form}>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#7b8490"
            style={styles.input}
            value={email}
          />
          <TextInput
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#7b8490"
            secureTextEntry
            style={styles.input}
            value={password}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            disabled={loading}
            onPress={handleLogin}
            style={[styles.button, loading && styles.buttonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f8fa",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  brand: {
    color: "#1f2933",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  title: {
    color: "#66717f",
    fontSize: 18,
    marginBottom: 32,
    textAlign: "center",
  },
  form: {
    gap: 14,
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#d7dce2",
    borderRadius: 8,
    borderWidth: 1,
    color: "#1f2933",
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#176b87",
    borderRadius: 8,
    marginTop: 6,
    paddingVertical: 15,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  error: {
    color: "#b42318",
    fontSize: 14,
    textAlign: "center",
  },
});
