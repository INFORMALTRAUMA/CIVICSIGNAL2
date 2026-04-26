import { Linking, Pressable, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { API_BASE_URL } from "@/lib/config"
import { useAuth } from "@/lib/auth"
import { colors, font, radius, space } from "@/lib/theme"

export default function AccountScreen() {
  const router = useRouter()
  const { user, signOut } = useAuth()

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Signed in</Text>
        <Text style={styles.copy}>{user?.email ?? user?.phone ?? "No user session"}</Text>
        <Pressable onPress={signOut} style={styles.linkBtn}>
          <Text style={styles.linkBtnText}>Sign out</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Citizen tools</Text>
        <Pressable onPress={() => router.push("/archive")} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Closed archive</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>API Base URL</Text>
        <Text style={styles.base}>{API_BASE_URL}</Text>
        <Pressable onPress={() => Linking.openURL(API_BASE_URL)} style={styles.linkBtn}>
          <Text style={styles.linkBtnText}>Open backend</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: space.lg, gap: space.md, backgroundColor: colors.background },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.md + 2,
    gap: space.sm
  },
  title: { color: colors.text, fontWeight: "600", fontSize: font.body },
  copy: { color: colors.textSecondary, lineHeight: 22, fontSize: font.small },
  label: { color: colors.textSecondary, fontSize: font.caption, fontWeight: "500" },
  base: { color: colors.text, fontWeight: "500", fontSize: font.small },
  linkBtn: {
    marginTop: space.xs,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
    borderRadius: radius.pill,
    paddingVertical: space.sm + 2,
    alignItems: "center"
  },
  linkBtnText: { color: colors.accent, fontWeight: "600", fontSize: font.small },
  secondaryBtn: {
    marginTop: space.xs,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    paddingVertical: space.sm + 2,
    alignItems: "center"
  },
  secondaryBtnText: { color: colors.text, fontWeight: "600", fontSize: font.small }
})
