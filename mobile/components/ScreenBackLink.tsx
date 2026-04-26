import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native"
import { useRouter, type Href } from "expo-router"
import { colors, font, space } from "@/lib/theme"

type ScreenBackLinkProps = {
  /** When there is no navigation history, navigate here instead of `router.back()`. */
  fallbackHref?: Href
  /** Optional label (default implies return to previous screen). */
  label?: string
  style?: StyleProp<ViewStyle>
}

export function ScreenBackLink({ fallbackHref = "/(tabs)", label = "Back", style }: ScreenBackLinkProps) {
  const router = useRouter()

  const goBack = () => {
    if (router.canGoBack()) {
      router.back()
      return
    }
    router.replace(fallbackHref)
  }

  return (
    <View style={[styles.wrap, style]}>
      <Pressable
        onPress={goBack}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
        hitSlop={{ top: 12, bottom: 12, left: 8, right: 16 }}
        accessibilityRole="button"
        accessibilityLabel={`${label}, return to previous screen`}
      >
        <Text style={styles.chevron}>‹</Text>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    alignSelf: "flex-start"
  },
  pressable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2
  },
  pressed: { opacity: 0.65 },
  chevron: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.accent,
    marginTop: -2,
    marginRight: 2
  },
  label: {
    fontSize: font.body,
    fontWeight: "600",
    color: colors.accent
  }
})
