import { useState } from "react"
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import { Redirect, useRouter } from "expo-router"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { ScreenBackLink } from "@/components/ScreenBackLink"
import { useAuth } from "@/lib/auth"
import { colors, font, radius, space } from "@/lib/theme"

export default function SignInScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { session, signIn, signUp, loading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!loading && session) {
    return <Redirect href="/(tabs)" />
  }

  const handleSubmit = async () => {
    setBusy(true)
    setError(null)
    const fn = mode === "signin" ? signIn : signUp
    const result = await fn(email.trim(), password)
    if (result.error) {
      setError(result.error)
    }
    setBusy(false)
  }

  const keyboardOffset = Platform.OS === "ios" ? insets.top + 8 : 0

  return (
    <SafeAreaView style={styles.safeRoot} edges={["top", "left", "right"]}>
      {router.canGoBack() ? <ScreenBackLink label="Back" style={styles.signInBack} /> : null}
      <KeyboardAvoidingView
        style={styles.kbdFlex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={keyboardOffset}
      >
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Civic Signal</Text>
            <Text style={styles.copy}>{mode === "signin" ? "Sign in to continue" : "Create your account"}</Text>

            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={colors.placeholder}
              style={styles.input}
              returnKeyType="next"
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Password"
              placeholderTextColor={colors.placeholder}
              style={styles.input}
              returnKeyType="done"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable style={[styles.primaryBtn, busy && styles.disabled]} onPress={handleSubmit} disabled={busy}>
              {busy ? (
                <ActivityIndicator color={colors.onAccent} />
              ) : (
                <Text style={styles.primaryBtnText}>{mode === "signin" ? "Sign in" : "Create account"}</Text>
              )}
            </Pressable>

            <Pressable onPress={() => setMode((value) => (value === "signin" ? "signup" : "signin"))}>
              <Text style={styles.switchText}>
                {mode === "signin" ? "No account? Create one" : "Already have an account? Sign in"}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeRoot: { flex: 1, backgroundColor: colors.background },
  kbdFlex: { flex: 1 },
  signInBack: { paddingBottom: 0 },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: space.lg,
    paddingTop: space.sm
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg + 2,
    backgroundColor: colors.surface,
    padding: space.lg,
    gap: space.md
  },
  title: { fontSize: font.titleLarge + 2, fontWeight: "700", color: colors.text, letterSpacing: -0.3 },
  copy: { color: colors.textSecondary, fontSize: font.small },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md - 2,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
    color: colors.text,
    fontSize: font.body
  },
  primaryBtn: {
    backgroundColor: colors.text,
    borderRadius: radius.pill,
    paddingVertical: space.md,
    alignItems: "center",
    marginTop: space.xs
  },
  primaryBtnText: {
    color: colors.onAccent,
    fontWeight: "600",
    fontSize: font.body
  },
  switchText: { textAlign: "center", color: colors.accent, marginTop: space.sm, fontWeight: "600", fontSize: font.small },
  error: { color: colors.error, fontSize: font.caption },
  disabled: { opacity: 0.65 }
})
