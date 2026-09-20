import { Redirect } from "expo-router";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
} from "react-native";

import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#176b87" />
        <Text style={styles.text}>Checking authentication...</Text>
      </SafeAreaView>
    );
  }

  return <Redirect href={session ? "/dashboard" : "/login"} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  text: { color: "#66717f", fontSize: 16 },
});
