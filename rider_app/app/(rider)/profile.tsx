import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

type ProfileRecord = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string | null;
  status: string | null;
};

type RiderRecord = {
  id: string;
  approval_status: string | null;
  rider_status: string | null;
  vehicle_type: string | null;
  vehicle_number: string | null;
  rating: number | string | null;
  total_deliveries: number | string | null;
  total_earnings: number | string | null;
  is_online: boolean | null;
};

function formatCurrency(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return `GHS ${numeric.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "N/A";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [rider, setRider] = useState<RiderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadProfile = useCallback(
    async (isRefresh = false) => {
      if (!user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const [profileResponse, riderResponse] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name, email, phone, avatar_url, role, status")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("riders")
            .select(
              "id, approval_status, rider_status, vehicle_type, vehicle_number, rating, total_deliveries, total_earnings, is_online",
            )
            .eq("id", user.id)
            .maybeSingle(),
        ]);

        if (profileResponse.error) throw profileResponse.error;
        if (riderResponse.error) throw riderResponse.error;

        const nextProfile =
          (profileResponse.data as ProfileRecord | null) ?? null;
        const nextRider = (riderResponse.data as RiderRecord | null) ?? null;

        setProfile(nextProfile);
        setRider(nextRider);
      } catch (loadError) {
        if (__DEV__) console.error("Unable to load rider profile:", loadError);
        setError(
          "Unable to load your profile right now. Please check your connection and try again.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user],
  );

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function handleSignOut() {
    setError(null);
    const signOutError = await signOut();
    if (signOutError) {
      setError(signOutError);
      return;
    }
    router.replace("/login");
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator color="#f26a21" size="large" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (!profile || !rider) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.errorTitle}>Profile unavailable</Text>
        <Text style={styles.errorText}>
          We could not load your rider profile right now.
        </Text>
        <Pressable
          onPress={() => void loadProfile()}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const displayName = profile.full_name?.trim() || "Rider";
  const initial = displayName.charAt(0).toUpperCase() || "R";
  const riderStatus =
    rider.rider_status === "active"
      ? "Active"
      : formatLabel(rider.rider_status);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={["#f26a21"]}
            onRefresh={() => void loadProfile(true)}
            refreshing={refreshing}
            tintColor="#f26a21"
          />
        }
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            {profile.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.defaultAvatar}>
                <Text style={styles.defaultAvatarText}>{initial}</Text>
              </View>
            )}
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>✓</Text>
            </View>
          </View>

          <Text style={styles.headerName}>{displayName}</Text>
          <View style={styles.idBadge}>
            <Text style={styles.idBadgeText}>
              ID: SSF-RD-{profile.id.slice(0, 4).toUpperCase()}
            </Text>
          </View>
          <View style={styles.inlineStatusRow}>
            <View style={styles.greenDot} />
            <Text style={styles.inlineStatusText}>{riderStatus}</Text>
            <Text style={styles.ratingBadge}>
              ★ {Number(rider.rating ?? 0).toFixed(1)} Rating
            </Text>
            <Text style={styles.deliveryBadge}>
              {Number(rider.total_deliveries ?? 0)} Deliveries
            </Text>
          </View>
        </View>

        {error ? <Text style={styles.errorTextBox}>{error}</Text> : null}
        {success ? <Text style={styles.successTextBox}>{success}</Text> : null}

        <View style={styles.infoGrid}>
          <View style={styles.infoCell}>
            <Text style={styles.label}>PHONE</Text>
            <Text style={styles.infoValue}>
              {profile.phone || "Not provided"}
            </Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.label}>EMAIL</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {profile.email || "Not provided"}
            </Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.label}>VEHICLE TYPE</Text>
            <Text style={styles.infoValue}>
              {formatLabel(rider.vehicle_type)}
            </Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.label}>REGISTRATION NO.</Text>
            <Text style={styles.infoValue}>
              {rider.vehicle_number || "N/A"}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>ACCOUNT</Text>
        <View style={styles.settingsRow}>
          <View style={[styles.rowIcon, styles.orangeIcon]}>
            <Text style={styles.rowIconText}>♙</Text>
          </View>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>Profile Details</Text>
            <Text style={styles.rowSubtitle}>
              Name and phone are managed by the account
            </Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>VEHICLE</Text>
        <Pressable style={styles.settingsRow}>
          <View style={[styles.rowIcon, styles.greenIcon]}>
            <Text style={styles.rowIconText}>♧</Text>
          </View>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>Vehicle Information</Text>
            <Text style={styles.rowSubtitle}>
              {formatLabel(rider.vehicle_type)} ·{" "}
              {rider.vehicle_number || "No registration"}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Text style={styles.sectionHeading}>PREFERENCES</Text>
        <Pressable style={styles.settingsRow}>
          <View style={[styles.rowIcon, styles.blueIcon]}>
            <Text style={styles.rowIconText}>♧</Text>
          </View>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>Notifications & Alerts</Text>
            <Text style={styles.rowSubtitle}>Push alerts, dispatch sounds</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <Pressable style={styles.settingsRow}>
          <View style={[styles.rowIcon, styles.yellowIcon]}>
            <Text style={styles.rowIconText}>◖</Text>
          </View>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>Sound & Voice Navigation</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <Pressable style={styles.settingsRow}>
          <View style={[styles.rowIcon, styles.purpleIcon]}>
            <Text style={styles.rowIconText}>◔</Text>
          </View>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>Appearance & Theme</Text>
          </View>
          <Text style={styles.rowValue}>System Light</Text>
        </Pressable>
        <Pressable style={styles.settingsRow}>
          <View style={[styles.rowIcon, styles.tealIcon]}>
            <Text style={styles.rowIconText}>◎</Text>
          </View>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>Language</Text>
          </View>
          <Text style={styles.rowValue}>English</Text>
        </Pressable>

        <View style={styles.accountSummary}>
          <Text style={styles.accountSummaryText}>
            Approval: {formatLabel(rider.approval_status)} · Earnings:{" "}
            {formatCurrency(rider.total_earnings)}
          </Text>
        </View>

        <Pressable
          onPress={() => void handleSignOut()}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutButtonText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f7f7f5" },
  content: { paddingHorizontal: 8, paddingTop: 10, paddingBottom: 40 },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f7f7f5",
    padding: 24,
  },
  loadingText: { color: "#66717f", fontSize: 16, marginTop: 12 },
  errorTitle: { fontSize: 18, fontWeight: "700", color: "#1f2933" },
  errorText: {
    color: "#66717f",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#f26a21",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 16,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  secondaryButton: {
    backgroundColor: "#eef2f6",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flex: 1,
  },
  secondaryButtonText: {
    color: "#1f2933",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  profileCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    marginBottom: 10,
  },
  verifiedBadge: {
    position: "absolute",
    right: -2,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#1db88b",
    borderWidth: 2,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedBadgeText: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
  idBadge: {
    backgroundColor: "#fff4ec",
    borderColor: "#f6d5c1",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginTop: 4,
  },
  idBadgeText: { color: "#d65d1e", fontSize: 10, fontWeight: "700" },
  ratingBadge: {
    color: "#756524",
    backgroundColor: "#fff8dc",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 8,
  },
  deliveryBadge: {
    color: "#344054",
    backgroundColor: "#f0f2f4",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
    fontSize: 11,
    marginLeft: 5,
  },
  headerCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarWrap: { marginRight: 0, position: "relative" },
  avatar: { width: 66, height: 66, borderRadius: 33 },
  defaultAvatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#f26a21",
    alignItems: "center",
    justifyContent: "center",
  },
  defaultAvatarText: { color: "#ffffff", fontSize: 26, fontWeight: "700" },
  headerMeta: { flex: 1 },
  headerName: {
    color: "#1f2933",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 7,
  },
  headerId: { color: "#66717f", fontSize: 13, marginTop: 4 },
  inlineStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    flexWrap: "wrap",
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#20b25d",
    marginRight: 6,
  },
  inlineStatusText: { color: "#1f7a3d", fontSize: 12, fontWeight: "700" },
  inlineMeta: { color: "#66717f", fontSize: 12, marginLeft: 12 },
  infoGrid: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    padding: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  infoCell: {
    backgroundColor: "#f8f9fb",
    borderRadius: 8,
    width: "50%",
    paddingHorizontal: 8,
    paddingVertical: 7,
    minHeight: 50,
  },
  label: {
    color: "#8b96a3",
    fontSize: 9,
    letterSpacing: 0.4,
    marginBottom: 3,
    marginTop: 0,
    fontWeight: "700",
  },
  infoValue: { color: "#344054", fontSize: 11, fontWeight: "600" },
  input: {
    backgroundColor: "#f8f9fb",
    borderWidth: 1,
    borderColor: "#dfe4ea",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#1f2933",
    fontSize: 15,
  },
  readOnlyInput: { backgroundColor: "#f3f5f7", color: "#66717f" },
  editCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  editTitle: {
    color: "#1f2933",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  sectionHeading: {
    color: "#8b96a3",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 11,
    marginBottom: 6,
  },
  settingsRow: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    minHeight: 60,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  rowIconText: { fontSize: 17, color: "#f26a21" },
  orangeIcon: { backgroundColor: "#fff3eb" },
  greenIcon: { backgroundColor: "#effbf5" },
  blueIcon: { backgroundColor: "#eef6ff" },
  yellowIcon: { backgroundColor: "#fff9e8" },
  purpleIcon: { backgroundColor: "#f5efff" },
  tealIcon: { backgroundColor: "#eafaf8" },
  rowCopy: { flex: 1 },
  rowTitle: { color: "#344054", fontSize: 12, fontWeight: "700" },
  rowSubtitle: { color: "#8b96a3", fontSize: 10, marginTop: 2 },
  rowValue: { color: "#8b96a3", fontSize: 11 },
  chevron: { color: "#8b96a3", fontSize: 22, marginLeft: 8 },
  accountSummary: { paddingVertical: 14, alignItems: "center" },
  accountSummaryText: { color: "#8b96a3", fontSize: 10 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  disabledButton: { opacity: 0.5 },
  logoutButton: {
    backgroundColor: "#d93025",
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 18,
  },
  logoutButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
  },
  errorTextBox: {
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "#fecdd3",
    borderRadius: 10,
    color: "#9f1239",
    fontSize: 13,
    padding: 10,
    marginTop: 12,
  },
  successTextBox: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    borderRadius: 10,
    color: "#166534",
    fontSize: 13,
    padding: 10,
    marginTop: 12,
  },
});
