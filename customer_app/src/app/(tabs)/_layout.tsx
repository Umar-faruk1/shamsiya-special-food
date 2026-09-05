import { Tabs } from "expo-router";
import { BottomTabBar } from "../../components/BottomTabBar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={() => <BottomTabBar />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="explore" options={{ title: "Explore" }} />
      <Tabs.Screen name="orders" options={{ title: "Orders" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
