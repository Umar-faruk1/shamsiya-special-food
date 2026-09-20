import { SymbolView } from "expo-symbols";
import { Redirect, Tabs } from "expo-router";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
} from "react-native";

import { useAuth } from "@/context/AuthContext";

const icons = {
  dashboard: { ios: "house.fill", android: "home", web: "home" },
  orders: { ios: "shippingbox.fill", android: "inventory_2", web: "inventory" },
  earnings: { ios: "chart.bar.fill", android: "bar_chart", web: "bar_chart" },
  profile: {
    ios: "person.crop.circle.fill",
    android: "account_circle",
    web: "account_circle",
  },
} as const;

export default function RiderLayout() {
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#f26a21" />
        <Text style={styles.text}>Checking authentication...</Text>
      </SafeAreaView>
    );
  }

  if (!session) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#f26a21",
        tabBarInactiveTintColor: "#8a9199",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#eaedf0",
          borderTopWidth: 1,
          height: 76,
          paddingBottom: 12,
          paddingTop: 10,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <SymbolView name={icons.dashboard} size={22} tintColor={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color }) => (
            <SymbolView name={icons.orders} size={22} tintColor={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: "Earnings",
          tabBarIcon: ({ color }) => (
            <SymbolView name={icons.earnings} size={22} tintColor={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <SymbolView name={icons.profile} size={22} tintColor={color} />
          ),
        }}
      />
      <Tabs.Screen name="location" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="order/[id]" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#f7f7f5",
  },
  text: { color: "#66717f", fontSize: 16 },
});
