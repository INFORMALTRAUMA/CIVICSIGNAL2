import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native"
import { useRouter } from "expo-router"
import { fetchIssueCountByStatus, fetchIssues, type Issue } from "@/lib/api"
import { colors, font, radius, space } from "@/lib/theme"

type QueueTabId = "all" | "open" | "in_progress" | "resolved"

function partitionActive(issues: Issue[]) {
  return {
    open: issues.filter((i) => i.status === "open"),
    inProgress: issues.filter((i) => i.status === "in_progress"),
    resolved: issues.filter((i) => i.status === "resolved")
  }
}

export default function FeedScreen() {
  const router = useRouter()
  const [issues, setIssues] = useState<Issue[]>([])
  const [closedCount, setClosedCount] = useState(0)
  const [activeTab, setActiveTab] = useState<QueueTabId>("all")
  const [searchDraft, setSearchDraft] = useState("")
  const [searchApplied, setSearchApplied] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (search: string) => {
    try {
      setError(null)
      const trimmed = search.trim()
      const [activeRows, closed] = await Promise.all([
        fetchIssues({
          limit: 100,
          excludeClosed: true,
          ...(trimmed ? { search: trimmed } : {})
        }),
        fetchIssueCountByStatus("closed")
      ])
      setIssues(activeRows)
      setClosedCount(closed)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load feed")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load(searchApplied)
  }, [load, searchApplied])

  const buckets = useMemo(() => partitionActive(issues), [issues])

  const listForTab = useMemo(() => {
    switch (activeTab) {
      case "open":
        return buckets.open
      case "in_progress":
        return buckets.inProgress
      case "resolved":
        return buckets.resolved
      default:
        return issues
    }
  }, [activeTab, buckets, issues])

  const tabs: { id: QueueTabId; label: string; count: number }[] = [
    { id: "all", label: "All", count: issues.length },
    { id: "open", label: "Open", count: buckets.open.length },
    { id: "in_progress", label: "Progress", count: buckets.inProgress.length },
    { id: "resolved", label: "Resolved", count: buckets.resolved.length }
  ]

  const applySearch = () => {
    Keyboard.dismiss()
    setLoading(true)
    setSearchApplied(searchDraft.trim())
  }

  if (loading && issues.length === 0 && !error) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.kpiRow}>
        <Pressable style={styles.kpiCell} onPress={() => setActiveTab("open")}>
          <Text style={styles.kpiLabel}>Open</Text>
          <Text style={styles.kpiValue}>{buckets.open.length}</Text>
        </Pressable>
        <Pressable style={styles.kpiCell} onPress={() => setActiveTab("in_progress")}>
          <Text style={styles.kpiLabel}>In progress</Text>
          <Text style={styles.kpiValue}>{buckets.inProgress.length}</Text>
        </Pressable>
        <Pressable style={styles.kpiCell} onPress={() => setActiveTab("resolved")}>
          <Text style={styles.kpiLabel}>Resolved</Text>
          <Text style={styles.kpiValue}>{buckets.resolved.length}</Text>
        </Pressable>
        <Pressable style={styles.kpiCell} onPress={() => router.push("/archive")}>
          <Text style={styles.kpiLabel}>Closed</Text>
          <Text style={[styles.kpiValue, styles.kpiLink]}>{closedCount}</Text>
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          value={searchDraft}
          onChangeText={setSearchDraft}
          placeholder="Search title or description"
          placeholderTextColor={colors.textSecondary}
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={applySearch}
        />
        <Pressable onPress={applySearch} style={styles.searchBtn}>
          <Text style={styles.searchBtnText}>Search</Text>
        </Pressable>
      </View>

      <View style={styles.tabRow}>
        {tabs.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setActiveTab(t.id)}
            style={[styles.tab, activeTab === t.id && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}>
              {t.label} ({t.count})
            </Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={listForTab}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              load(searchApplied)
            }}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        contentContainerStyle={[styles.list, listForTab.length === 0 && styles.listEmpty]}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              Keyboard.dismiss()
              router.push(`/issue/${item.id}`)
            }}
            style={styles.card}
          >
            <View style={styles.row}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.score}>{item.priority_score.toFixed(1)}</Text>
            </View>
            <Text numberOfLines={2} style={styles.copy}>
              {item.description}
            </Text>
            <View style={styles.row}>
              <Text style={styles.meta}>{item.status.replace("_", " ")}</Text>
              <Text style={styles.meta}>{item.upvote_count} upvotes</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          error ? null : <Text style={styles.copy}>No signals in this queue.</Text>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  kpiRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface
  },
  kpiCell: { flex: 1, paddingVertical: space.md, paddingHorizontal: space.xs, alignItems: "center" },
  kpiLabel: { fontSize: font.caption, color: colors.textSecondary, fontWeight: "600", textAlign: "center" },
  kpiValue: { marginTop: 4, fontSize: font.body, fontWeight: "700", color: colors.text, fontVariant: ["tabular-nums"] },
  kpiLink: { color: colors.accent, textDecorationLine: "underline" },
  searchRow: {
    flexDirection: "row",
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
    color: colors.text,
    backgroundColor: colors.surface,
    fontSize: font.small
  },
  searchBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
    borderRadius: radius.md
  },
  searchBtnText: { color: colors.surface, fontWeight: "600", fontSize: font.small },
  tabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.sm
  },
  tab: {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  tabActive: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  tabText: { fontSize: font.caption, fontWeight: "600", color: colors.textSecondary },
  tabTextActive: { color: colors.accent },
  list: { padding: space.lg, paddingBottom: space.xl, gap: space.md },
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
    paddingTop: space.sm,
    fontSize: font.small,
    lineHeight: 20
  }
})
