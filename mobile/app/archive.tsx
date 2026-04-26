import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { ScreenBackLink } from "@/components/ScreenBackLink"
import { fetchIssues, type Issue } from "@/lib/api"
import { colors, font, radius, space } from "@/lib/theme"

export default function ArchiveScreen() {
  const router = useRouter()
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const data = await fetchIssues({ status: "closed", limit: 50 })
      setIssues(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load archive")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <View style={styles.shell}>
        <ScreenBackLink label="Back" />
        <View style={styles.centerExpand}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingHint}>Loading closed signals…</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.shell}>
      <ScreenBackLink label="Back" />
      <Text style={styles.intro}>Closed signals from your city (latest 50).</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        style={styles.listFlex}
        data={issues}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              load()
            }}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        contentContainerStyle={[styles.list, issues.length === 0 && styles.listEmpty]}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/issue/${item.id}`)} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.score}>{item.priority_score.toFixed(1)}</Text>
            </View>
            <Text numberOfLines={2} style={styles.copy}>
              {item.description}
            </Text>
            <Text style={styles.meta}>{item.upvote_count} upvotes</Text>
          </Pressable>
        )}
        ListEmptyComponent={error ? null : <Text style={styles.copy}>No closed signals.</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.background },
  centerExpand: { flex: 1, alignItems: "center", justifyContent: "center", gap: space.md, padding: space.lg },
  loadingHint: { color: colors.textSecondary, fontSize: font.small },
  listFlex: { flex: 1 },
  intro: {
    paddingHorizontal: space.lg,
    paddingTop: space.xs,
    paddingBottom: space.sm,
    color: colors.textSecondary,
    fontSize: font.small,
    lineHeight: 20
  },
  list: { paddingHorizontal: space.lg, paddingBottom: space.xl, gap: space.md },
  listEmpty: { flexGrow: 1, justifyContent: "center" },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: space.md + 2,
    gap: space.sm
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: colors.text, fontWeight: "600", fontSize: font.body, flex: 1, paddingRight: space.sm },
  score: { color: colors.accent, fontWeight: "700", fontSize: font.small },
  copy: { color: colors.textSecondary, fontSize: font.small, lineHeight: 20 },
  meta: { color: colors.textSecondary, fontSize: font.caption },
  error: {
    color: colors.error,
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
    fontSize: font.small,
    lineHeight: 20
  }
})
