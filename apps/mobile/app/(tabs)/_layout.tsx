import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Tabs } from "expo-router";

export default function TabsLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#e76f51",
        headerStyle: { backgroundColor: "#ffffff" },
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Today" }} />
      <Tabs.Screen name="workouts" options={{ title: "Workouts" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
