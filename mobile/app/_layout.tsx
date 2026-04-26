import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { AuthProvider } from "@/lib/auth"
import { colors } from "@/lib/theme"

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: "600", fontSize: 17 },
            headerBackTitle: "Back",
            contentStyle: { backgroundColor: colors.background },
            animation: "slide_from_right",
            gestureEnabled: true
          }}
        >
          <Stack.Screen name="sign-in" options={{ title: "Sign in", headerBackTitle: "Back" }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="archive" options={{ title: "Closed archive", headerBackTitle: "Back" }} />
          <Stack.Screen name="issue/[id]" options={{ title: "Signal", headerBackTitle: "Back" }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
