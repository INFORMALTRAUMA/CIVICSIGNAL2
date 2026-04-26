import { Redirect, Tabs, router } from "expo-router"
import { ActivityIndicator, Keyboard, Pressable, Text, View } from "react-native"
import { useAuth } from "@/lib/auth"
import { colors, font } from "@/lib/theme"

function ReportHeaderToFeed() {
  return (
    <Pressable
      onPress={() => {
        Keyboard.dismiss()
        router.navigate("/(tabs)")
      }}
      hitSlop={{ top: 10, bottom: 10, left: 8, right: 12 }}
      style={{ flexDirection: "row", alignItems: "center", paddingLeft: 4 }}
      accessibilityRole="button"
      accessibilityLabel="Go to feed"
    >
      <Text style={{ fontSize: 22, fontWeight: "600", color: colors.accent, marginTop: -1 }}>‹</Text>
      <Text style={{ fontSize: font.body, fontWeight: "600", color: colors.accent, marginLeft: 2 }}>Feed</Text>
    </Pressable>
  )
}

export default function TabsLayout() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    )
  }

  if (!session) {
    return <Redirect href="/sign-in" />
  }

  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "600", fontSize: 17 },
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" }
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Feed", headerTitle: "Citizen feed" }} />
      <Tabs.Screen
        name="report"
        options={{
          title: "Report",
          headerTitle: "Report signal",
          headerLeft: () => <ReportHeaderToFeed />
        }}
      />
      <Tabs.Screen name="account" options={{ title: "Account", headerTitle: "Account" }} />
    </Tabs>
  )
}
