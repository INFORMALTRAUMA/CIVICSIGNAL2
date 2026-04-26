import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useLocalSearchParams, useNavigation } from "expo-router"
import { ScreenBackLink } from "@/components/ScreenBackLink"
import {
  fetchIssueById,
  fetchIssueVerificationCount,
  fetchUserVerificationStatus,
  reportIssueDuplicate,
  upvoteIssue,
  verifyIssueResolution,
  type Issue
} from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { colors, font, radius, space } from "@/lib/theme"

export default function IssueDetailScreen() {
  const navigation = useNavigation()
  const { user } = useAuth()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [issue, setIssue] = useState<Issue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [verificationCount, setVerificationCount] = useState(0)
  const [alreadyVerified, setAlreadyVerified] = useState(false)
  const [verifyBusy, setVerifyBusy] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null)
  const [actionBusy, setActionBusy] = useState<"upvote" | "report" | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const lastLoadedId = useRef<string | null>(null)

  useEffect(() => {
    if (!id) return
    const isNewIssue = lastLoadedId.current !== id
    if (isNewIssue) {
      lastLoadedId.current = id
      setLoading(true)
    }
    let cancelled = false
    ;(async () => {
      try {
        setError(null)
        const data = await fetchIssueById(id, user?.id)
        if (!cancelled) setIssue(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load issue")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, user?.id])

  useLayoutEffect(() => {
    const t = issue?.title?.trim()
    const headerTitle = t
      ? t.length > 32
        ? `${t.slice(0, 32)}…`
        : t
      : "Signal"
    navigation.setOptions({ title: headerTitle })
  }, [issue?.title, navigation])

  const refreshIssue = async () => {
    if (!id) return
    try {
      const data = await fetchIssueById(id, user?.id)
      setIssue(data)
    } catch {
      /* keep existing issue */
    }
  }

  const handleUpvote = async () => {
    if (!id || !user?.id || actionBusy) return
    setActionError(null)
    setActionBusy("upvote")
    try {
      await upvoteIssue(id, user.id)
      await refreshIssue()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Upvote failed")
    } finally {
      setActionBusy(null)
    }
  }

  const handleReportDuplicate = async () => {
    if (!id || !user?.id || actionBusy) return
    setActionError(null)
    setActionBusy("report")
    try {
      await reportIssueDuplicate(id, user.id, "Me too — same problem (mobile).")
      await refreshIssue()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Report failed")
    } finally {
      setActionBusy(null)
    }
  }

  useEffect(() => {
    const loadVerification = async () => {
      if (!id) return
      try {
        const countPromise = fetchIssueVerificationCount(id)
        const verifiedPromise = user?.id ? fetchUserVerificationStatus(id, user.id) : Promise.resolve(false)
        const [count, verified] = await Promise.all([countPromise, verifiedPromise])
        setVerificationCount(count)
        setAlreadyVerified(verified)
      } catch {
        // Keep verification UI resilient even if this request fails.
      }
    }

    loadVerification()
  }, [id, user?.id])

  useEffect(() => {
    if (!id) return

    const channel = supabase
      .channel(`issue-detail-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "issue_resolutions", filter: `issue_id=eq.${id}` },
        (payload) => {
          const next = payload.new as { verification_count?: number } | null
          if (typeof next?.verification_count === "number") {
            setVerificationCount(next.verification_count)
            return
          }
          if (payload.eventType === "DELETE") {
            setVerificationCount(0)
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "issue_verifications", filter: `issue_id=eq.${id}` },
        (payload) => {
          const next = payload.new as { user_id?: string } | null
          if (user?.id && next?.user_id === user.id) {
            setAlreadyVerified(true)
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "issues", filter: `id=eq.${id}` },
        (payload) => {
          const next = payload.new as Partial<Issue>
          if (!next.status) return
          setIssue((current) => (current ? { ...current, status: next.status as Issue["status"] } : current))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, user?.id])

  const handleVerify = async () => {
    if (!id || !user?.id || verifyBusy || alreadyVerified) return
    setVerifyError(null)
    setVerifySuccess(null)
    setVerifyBusy(true)
    try {
      await verifyIssueResolution(id, user.id)
      const [count, verified] = await Promise.all([
        fetchIssueVerificationCount(id),
        fetchUserVerificationStatus(id, user.id)
      ])
      setVerificationCount(count)
      setAlreadyVerified(verified)
      setVerifySuccess("Thanks for confirming the resolution.")
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Unable to verify")
    } finally {
      setVerifyBusy(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.shell}>
        <ScreenBackLink label="Back to feed" />
        <View style={styles.centerExpand}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingHint}>Loading this signal…</Text>
        </View>
      </View>
    )
  }

  if (error || !issue) {
    return (
      <View style={styles.shell}>
        <ScreenBackLink label="Back to feed" />
        <View style={styles.centerExpand}>
          <Text style={styles.error}>{error ?? "Issue not found"}</Text>
          <Text style={styles.errorHint}>Check your connection or try opening the signal again from the feed.</Text>
        </View>
      </View>
    )
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <ScreenBackLink label="Back to feed" style={styles.backInScroll} />
      <View style={styles.card}>
        <Text style={styles.title}>{issue.title}</Text>
        <Text style={styles.meta}>{issue.status.replace("_", " ")}</Text>
        <Text style={styles.copy}>{issue.description}</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Priority</Text>
          <Text style={styles.statValue}>{issue.priority_score.toFixed(1)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Upvotes</Text>
          <Text style={styles.statValue}>{issue.upvote_count}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Reports</Text>
          <Text style={styles.statValue}>{issue.report_count}</Text>
        </View>
      </View>

      <View style={styles.actionsCard}>
        <Text style={styles.actionsTitle}>Community</Text>
        <Text style={styles.actionsCopy}>Upvote to raise urgency, or add your voice if this is the same problem.</Text>
        <View style={styles.actionsRow}>
          <Pressable
            onPress={handleUpvote}
            disabled={Boolean(actionBusy) || issue.viewer_has_upvoted || !user?.id}
            style={({ pressed }) => [
              styles.actionBtnSecondary,
              (pressed || actionBusy === "upvote" || issue.viewer_has_upvoted || !user?.id) && styles.actionBtnDisabled
            ]}
          >
            <Text style={styles.actionBtnSecondaryText}>
              {!user?.id
                ? "Sign in to upvote"
                : issue.viewer_has_upvoted
                  ? `Upvoted (${issue.upvote_count})`
                  : actionBusy === "upvote"
                    ? "Upvoting…"
                    : `Upvote (${issue.upvote_count})`}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleReportDuplicate}
            disabled={Boolean(actionBusy) || issue.viewer_has_reported || !user?.id}
            style={({ pressed }) => [
              styles.actionBtnPrimary,
              (pressed || actionBusy === "report" || issue.viewer_has_reported || !user?.id) && styles.actionBtnDisabled
            ]}
          >
            <Text style={styles.actionBtnPrimaryText}>
              {!user?.id
                ? "Sign in"
                : issue.viewer_has_reported
                  ? `Reported (${issue.report_count})`
                  : actionBusy === "report"
                    ? "Sending…"
                    : `Me too (${issue.report_count})`}
            </Text>
          </Pressable>
        </View>
        {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}
      </View>

      {issue.status === "resolved" && (
        <View style={styles.verifyCard}>
          <Text style={styles.verifyTitle}>Resolved? Verify</Text>
          <Text style={styles.verifyCopy}>Confirm whether this issue is actually fixed in your area.</Text>
          <View style={styles.verifyRow}>
            <Text style={styles.verifyChip}>{verificationCount} confirmations</Text>
            <Pressable
              onPress={handleVerify}
              disabled={verifyBusy || alreadyVerified || !user?.id}
              style={({ pressed }) => [
                styles.verifyButton,
                (pressed || verifyBusy || alreadyVerified || !user?.id) && styles.verifyButtonDisabled
              ]}
            >
              <Text style={styles.verifyButtonText}>
                {!user?.id ? "Sign in to verify" : alreadyVerified ? "Verified" : verifyBusy ? "Verifying..." : "Verify"}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.verifyHint}>Only one verification per account.</Text>
          {verifyError ? <Text style={styles.verifyError}>{verifyError}</Text> : null}
          {verifySuccess ? <Text style={styles.verifySuccess}>{verifySuccess}</Text> : null}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.background },
  centerExpand: { flex: 1, alignItems: "center", justifyContent: "center", padding: space.lg, gap: space.md },
  loadingHint: { color: colors.textSecondary, fontSize: font.small, marginTop: space.sm },
  errorHint: { color: colors.textSecondary, fontSize: font.small, textAlign: "center", lineHeight: 20, marginTop: space.sm },
  backInScroll: { paddingHorizontal: 0, paddingVertical: 0, marginBottom: space.xs },
  container: {
    padding: space.lg,
    gap: space.md,
    paddingBottom: space.xl * 2,
    backgroundColor: colors.background,
    flexGrow: 1
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.md + 2,
    gap: space.sm
  },
  title: { color: colors.text, fontSize: font.title, fontWeight: "600" },
  meta: { color: colors.textSecondary, fontSize: font.caption, fontWeight: "500" },
  copy: { color: colors.textSecondary, lineHeight: 22, fontSize: font.small },
  statsRow: { flexDirection: "row", gap: space.md },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: space.md,
    alignItems: "center"
  },
  statLabel: { color: colors.textSecondary, fontSize: font.caption, fontWeight: "500" },
  statValue: { color: colors.text, fontWeight: "700", fontSize: font.title, marginTop: space.xs },
  actionsCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: space.md + 2,
    gap: space.sm
  },
  actionsTitle: { color: colors.text, fontSize: font.body, fontWeight: "600" },
  actionsCopy: { color: colors.textSecondary, lineHeight: 20, fontSize: font.small },
  actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.sm },
  actionBtnSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: space.sm + 2,
    paddingHorizontal: space.md,
    alignItems: "center",
    backgroundColor: colors.surfaceMuted
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: colors.text,
    borderRadius: radius.pill,
    paddingVertical: space.sm + 2,
    paddingHorizontal: space.md,
    alignItems: "center"
  },
  actionBtnDisabled: { opacity: 0.55 },
  actionBtnSecondaryText: { color: colors.text, fontWeight: "600", fontSize: font.caption },
  actionBtnPrimaryText: { color: colors.onAccent, fontWeight: "600", fontSize: font.caption },
  actionError: { color: colors.error, fontSize: font.small, marginTop: space.xs },
  error: { color: colors.error },
  verifyCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: space.md + 2,
    gap: space.sm
  },
  verifyTitle: { color: colors.text, fontSize: font.body, fontWeight: "600" },
  verifyCopy: { color: colors.textSecondary, lineHeight: 20, fontSize: font.small },
  verifyRow: {
    marginTop: space.sm - 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md
  },
  verifyChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm + 2,
    paddingVertical: space.sm - 2,
    fontSize: font.caption,
    color: colors.textSecondary,
    fontWeight: "500",
    backgroundColor: colors.surfaceMuted
  },
  verifyButton: {
    backgroundColor: colors.text,
    borderRadius: radius.pill,
    paddingHorizontal: space.md + 2,
    paddingVertical: space.sm + 2
  },
  verifyButtonDisabled: { opacity: 0.55 },
  verifyButtonText: {
    color: colors.onAccent,
    fontSize: font.caption,
    fontWeight: "600"
  },
  verifyHint: { color: colors.textSecondary, fontSize: font.caption - 1 },
  verifyError: { color: colors.error, fontSize: font.small },
  verifySuccess: { color: colors.success, fontSize: font.small }
})
