import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native"
import { useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import * as Location from "expo-location"
import * as ImagePicker from "expo-image-picker"
import {
  createIssue,
  fetchDuplicateMatches,
  reportIssueDuplicate,
  uploadIssueMedia,
  upvoteIssue,
  type DuplicateMatch
} from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { colors, font, radius, space } from "@/lib/theme"

export default function ReportScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [severity, setSeverity] = useState("3")
  const [lat, setLat] = useState("")
  const [lng, setLng] = useState("")
  const [media, setMedia] = useState<ImagePicker.ImagePickerAsset[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([])
  const [checkingDupes, setCheckingDupes] = useState(false)
  const [dupError, setDupError] = useState<string | null>(null)
  const [dupBusyId, setDupBusyId] = useState<string | null>(null)
  const [dupActionKind, setDupActionKind] = useState<"upvote" | "report" | null>(null)

  const queryText = useMemo(() => [title, description].filter(Boolean).join(" ").trim(), [title, description])

  useEffect(() => {
    setDuplicates([])
    setDupError(null)
  }, [title, description, lat, lng])

  const runDuplicateCheck = useCallback(async () => {
    setDupError(null)
    if (queryText.length < 3) {
      setDupError("Add at least 3 characters in title or description.")
      return
    }
    if (!lat || !lng || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
      setDupError("Set latitude and longitude first (use current location or enter manually).")
      return
    }
    setCheckingDupes(true)
    try {
      const rows = await fetchDuplicateMatches({
        lat: Number(lat),
        lng: Number(lng),
        query: queryText,
        viewerId: user?.id
      })
      setDuplicates(rows)
      if (rows.length === 0) {
        Alert.alert("No close matches", "No similar open signals in this area. You can still submit a new report.")
      }
    } catch (e) {
      setDupError(e instanceof Error ? e.message : "Duplicate check failed")
    } finally {
      setCheckingDupes(false)
    }
  }, [lat, lng, queryText, user?.id])

  const onUpvoteDuplicate = async (issueId: string) => {
    if (!user?.id) {
      Alert.alert("Sign in required", "Sign in to upvote an existing signal.")
      return
    }
    setDupBusyId(issueId)
    setDupActionKind("upvote")
    setDupError(null)
    try {
      const { created } = await upvoteIssue(issueId, user.id)
      setDuplicates((prev) =>
        prev.map((m) =>
          m.issue_id === issueId
            ? {
                ...m,
                upvote_count: created ? m.upvote_count + 1 : m.upvote_count,
                viewer_has_upvoted: true
              }
            : m
        )
      )
    } catch (e) {
      setDupError(e instanceof Error ? e.message : "Upvote failed")
    } finally {
      setDupBusyId(null)
      setDupActionKind(null)
    }
  }

  const onReportDuplicate = async (issueId: string) => {
    if (!user?.id) {
      Alert.alert("Sign in required", "Sign in to add your report to an existing signal.")
      return
    }
    setDupBusyId(issueId)
    setDupActionKind("report")
    setDupError(null)
    try {
      const { created } = await reportIssueDuplicate(issueId, user.id, "Reported as duplicate from mobile report flow.")
      setDuplicates((prev) =>
        prev.map((m) =>
          m.issue_id === issueId
            ? {
                ...m,
                report_count: created ? m.report_count + 1 : m.report_count,
                viewer_has_reported: true
              }
            : m
        )
      )
      Alert.alert("Recorded", created ? "Your report was added to that signal." : "You already reported this signal.")
    } catch (e) {
      setDupError(e instanceof Error ? e.message : "Report failed")
    } finally {
      setDupBusyId(null)
      setDupActionKind(null)
    }
  }

  const useCurrentLocation = async () => {
    const permission = await Location.requestForegroundPermissionsAsync()
    if (permission.status !== "granted") {
      Alert.alert("Location denied", "Please allow location to autofill coordinates.")
      return
    }
    const current = await Location.getCurrentPositionAsync({})
    setLat(current.coords.latitude.toFixed(6))
    setLng(current.coords.longitude.toFixed(6))
  }

  const submit = async () => {
    if (!user) {
      Alert.alert("Sign in required", "Please sign in to submit a signal.")
      return
    }
    if (!title.trim() || !description.trim() || !lat || !lng) {
      Alert.alert("Missing fields", "Title, description and coordinates are required.")
      return
    }
    if (title.trim().length < 3) {
      Alert.alert("Title too short", "Use at least 3 characters for the title.")
      return
    }
    if (description.trim().length < 10) {
      Alert.alert(
        "Description too short",
        "Use at least 10 characters so responders have enough context (server requirement)."
      )
      return
    }

    Keyboard.dismiss()
    setSubmitting(true)
    try {
      const created = await createIssue({
        title: title.trim(),
        description: description.trim(),
        severity: Number(severity) || 3,
        lat: Number(lat),
        lng: Number(lng),
        createdBy: user.id
      })

      let uploadedCount = 0
      let mediaWarning: string | null = null
      if (media.length > 0) {
        setUploadingMedia(true)
        try {
          const uploaded = await uploadIssueMedia({
            issueId: created.id,
            userId: user.id,
            assets: media
          })
          uploadedCount = uploaded.length
        } catch (err) {
          mediaWarning = err instanceof Error ? err.message : "Media upload failed"
        } finally {
          setUploadingMedia(false)
        }
      }

      if (mediaWarning) {
        Alert.alert(
          "Signal submitted",
          `Issue ${created.id.slice(0, 8)} created, but media upload failed.\n\n${mediaWarning}`
        )
      } else {
        Alert.alert(
          "Signal submitted",
          uploadedCount > 0
            ? `Issue ${created.id.slice(0, 8)} created with ${uploadedCount} media file(s).`
            : `Issue ${created.id.slice(0, 8)} created successfully.`
        )
      }
      setTitle("")
      setDescription("")
      setSeverity("3")
      setLat("")
      setLng("")
      setMedia([])
    } catch (error) {
      Alert.alert("Submit failed", error instanceof Error ? error.message : "Unknown error")
    } finally {
      setUploadingMedia(false)
      setSubmitting(false)
    }
  }

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow photo library access to attach evidence.")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      quality: 0.8
    })
    if (result.canceled) return
    setMedia((current) => [...current, ...result.assets])
  }

  const captureFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow camera access to capture evidence.")
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images", "videos"],
      quality: 0.8
    })
    if (result.canceled) return
    setMedia((current) => [...current, ...result.assets])
  }

  const keyboardVerticalOffset = Platform.OS === "ios" ? insets.top + 56 : 0

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.keyboardHintRow}>
          <Text style={styles.helper}>
            Use ‹ Feed in the header to return to your signal list. Scroll the form to dismiss the keyboard.
          </Text>
          <Pressable onPress={() => Keyboard.dismiss()} hitSlop={8} style={styles.hideKbdWrap}>
            <Text style={styles.hideKbdLink}>Hide keyboard</Text>
          </Pressable>
        </View>
      <Text style={styles.label}>Title</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Open manhole near market"
        placeholderTextColor={colors.placeholder}
        style={styles.input}
        returnKeyType="next"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Describe issue impact and landmarks"
        placeholderTextColor={colors.placeholder}
        style={[styles.input, styles.textArea]}
        multiline
      />

      <Text style={styles.label}>Severity (1-5)</Text>
      <TextInput
        value={severity}
        onChangeText={setSeverity}
        keyboardType="number-pad"
        placeholderTextColor={colors.placeholder}
        style={styles.input}
      />

      <View style={styles.locationRow}>
        <View style={styles.coordWrap}>
          <Text style={styles.label}>Latitude</Text>
          <TextInput
            value={lat}
            onChangeText={setLat}
            style={styles.input}
            keyboardType="decimal-pad"
            placeholderTextColor={colors.placeholder}
          />
        </View>
        <View style={styles.coordWrap}>
          <Text style={styles.label}>Longitude</Text>
          <TextInput
            value={lng}
            onChangeText={setLng}
            style={styles.input}
            keyboardType="decimal-pad"
            placeholderTextColor={colors.placeholder}
          />
        </View>
      </View>

      <Pressable style={styles.secondaryBtn} onPress={useCurrentLocation}>
        <Text style={styles.secondaryBtnText}>Use current location</Text>
      </Pressable>

      <View style={styles.dupCard}>
        <Text style={styles.dupTitle}>Similar signals</Text>
        <Text style={styles.dupCopy}>Search for open reports near your pin before filing a new signal.</Text>
        <Pressable
          style={[styles.secondaryBtn, checkingDupes && styles.disabled]}
          onPress={runDuplicateCheck}
          disabled={checkingDupes}
        >
          <Text style={styles.secondaryBtnText}>{checkingDupes ? "Checking…" : "Check for similar"}</Text>
        </Pressable>
        {dupError ? <Text style={styles.dupError}>{dupError}</Text> : null}
        {duplicates.length > 0 ? (
          <View style={styles.dupList}>
            {duplicates.map((m) => {
              const rowBusy = dupBusyId === m.issue_id
              return (
                <View key={m.issue_id} style={styles.dupItem}>
                  <Pressable
                    onPress={() => {
                      Keyboard.dismiss()
                      router.push(`/issue/${m.issue_id}`)
                    }}
                  >
                    <Text style={styles.dupItemTitle} numberOfLines={2}>
                      {m.title || "Signal"}
                    </Text>
                    <Text style={styles.dupMeta}>
                      {Math.round((m.similarity ?? 0) * 100)}% match · {Math.round(m.distance_m)}m · {m.upvote_count}{" "}
                      upvotes · {m.report_count} reports
                    </Text>
                  </Pressable>
                  <View style={styles.dupActions}>
                    <Pressable
                      style={[styles.dupSmallBtn, (m.viewer_has_upvoted || rowBusy) && styles.disabled]}
                      disabled={Boolean(m.viewer_has_upvoted) || rowBusy}
                      onPress={() => onUpvoteDuplicate(m.issue_id)}
                    >
                      <Text style={styles.dupSmallBtnText}>
                        {m.viewer_has_upvoted
                          ? "Upvoted"
                          : rowBusy && dupActionKind === "upvote"
                            ? "…"
                            : "Upvote"}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.dupSmallBtnPrimary, (m.viewer_has_reported || rowBusy) && styles.disabled]}
                      disabled={Boolean(m.viewer_has_reported) || rowBusy}
                      onPress={() => onReportDuplicate(m.issue_id)}
                    >
                      <Text style={styles.dupSmallBtnPrimaryText}>
                        {m.viewer_has_reported
                          ? "Reported"
                          : rowBusy && dupActionKind === "report"
                            ? "…"
                            : "Me too"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )
            })}
          </View>
        ) : null}
      </View>

      <View style={styles.mediaCard}>
        <Text style={styles.mediaTitle}>Attach media (optional)</Text>
        <Text style={styles.mediaCopy}>Add photos/videos for stronger evidence.</Text>
        <View style={styles.mediaActions}>
          <Pressable style={styles.mediaBtn} onPress={pickFromLibrary} disabled={submitting}>
            <Text style={styles.mediaBtnText}>Choose from gallery</Text>
          </Pressable>
          <Pressable style={styles.mediaBtn} onPress={captureFromCamera} disabled={submitting}>
            <Text style={styles.mediaBtnText}>Capture now</Text>
          </Pressable>
        </View>
        {media.length > 0 && (
          <View style={styles.mediaList}>
            {media.map((asset, index) => (
              <Text key={`${asset.uri}-${index}`} style={styles.mediaItem} numberOfLines={1}>
                {asset.fileName ?? `${asset.type ?? "media"} ${index + 1}`}
              </Text>
            ))}
            <Pressable onPress={() => setMedia([])} disabled={submitting}>
              <Text style={styles.clearMedia}>Clear attachments</Text>
            </Pressable>
          </View>
        )}
        {uploadingMedia ? <Text style={styles.uploadingText}>Uploading media...</Text> : null}
      </View>

      <Pressable style={[styles.primaryBtn, submitting && styles.disabled]} onPress={submit} disabled={submitting}>
        <Text style={styles.primaryBtnText}>{submitting ? "Submitting..." : "Submit signal"}</Text>
      </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  keyboardHintRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: space.md,
    marginBottom: space.md,
    paddingBottom: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  helper: {
    flex: 1,
    fontSize: font.caption,
    color: colors.textSecondary,
    lineHeight: 18
  },
  hideKbdWrap: { paddingTop: 2 },
  hideKbdLink: { fontSize: font.small, fontWeight: "600", color: colors.accent },
  container: {
    padding: space.lg,
    paddingBottom: space.xl * 3,
    gap: space.md,
    backgroundColor: colors.background,
    flexGrow: 1
  },
  label: { fontSize: font.caption, color: colors.textSecondary, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
    color: colors.text,
    fontSize: font.body
  },
  textArea: { minHeight: 120, textAlignVertical: "top" },
  locationRow: { flexDirection: "row", gap: space.md },
  coordWrap: { flex: 1 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
    borderRadius: radius.pill,
    paddingVertical: space.md,
    alignItems: "center",
    marginTop: space.sm
  },
  secondaryBtnText: { color: colors.accent, fontWeight: "600", fontSize: font.small },
  dupCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
    marginTop: space.sm
  },
  dupTitle: { color: colors.text, fontWeight: "600", fontSize: font.body },
  dupCopy: { color: colors.textSecondary, fontSize: font.small, lineHeight: 20 },
  dupError: { color: colors.error, fontSize: font.small },
  dupList: { marginTop: space.sm, gap: space.md },
  dupItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm + 2,
    padding: space.md,
    gap: space.sm,
    backgroundColor: colors.surfaceMuted
  },
  dupItemTitle: { color: colors.text, fontWeight: "600", fontSize: font.small },
  dupMeta: { color: colors.textSecondary, fontSize: font.caption, marginTop: 4 },
  dupActions: { flexDirection: "row", gap: space.sm, marginTop: space.sm },
  dupSmallBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: space.sm + 1,
    alignItems: "center",
    backgroundColor: colors.surface
  },
  dupSmallBtnPrimary: {
    flex: 1,
    backgroundColor: colors.text,
    borderRadius: radius.pill,
    paddingVertical: space.sm + 1,
    alignItems: "center"
  },
  dupSmallBtnText: { color: colors.text, fontWeight: "600", fontSize: font.caption },
  dupSmallBtnPrimaryText: { color: colors.onAccent, fontWeight: "600", fontSize: font.caption },
  mediaCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
    marginTop: space.sm
  },
  mediaTitle: { color: colors.text, fontWeight: "600", fontSize: font.body },
  mediaCopy: { color: colors.textSecondary, fontSize: font.small },
  mediaActions: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  mediaBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: space.sm + 1,
    paddingHorizontal: space.md
  },
  mediaBtnText: { color: colors.accent, fontWeight: "600", fontSize: font.caption },
  mediaList: {
    marginTop: space.sm - 2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm + 2,
    padding: space.sm + 2,
    gap: space.sm - 2,
    backgroundColor: colors.surfaceMuted
  },
  mediaItem: { color: colors.textSecondary, fontSize: font.small },
  clearMedia: { color: colors.error, fontSize: font.small, fontWeight: "500", marginTop: space.xs },
  uploadingText: { color: colors.textSecondary, fontSize: font.small },
  primaryBtn: {
    backgroundColor: colors.text,
    borderRadius: radius.pill,
    paddingVertical: space.md + 2,
    alignItems: "center",
    marginTop: space.sm
  },
  primaryBtnText: { color: colors.onAccent, fontWeight: "600", fontSize: font.body },
  disabled: { opacity: 0.55 }
})
