import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useRiderLocation } from "@/hooks/useRiderLocation";

const MapViewComponent =
  Platform.OS === "web" ? null : require("react-native-maps").default;
const MarkerComponent =
  Platform.OS === "web" ? null : require("react-native-maps").Marker;

type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const defaultRegion: MapRegion = {
  latitude: 5.6037,
  longitude: -0.187,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

export default function LocationScreen() {
  const mapRef = useRef<any>(null);
  const [hasCenteredOnUser, setHasCenteredOnUser] = useState(false);

  const {
    latitude,
    longitude,
    heading,
    speed,
    loading,
    permissionStatus,
    permissionGranted,
    error,
    online,
    isTracking,
    requestPermission,
    toggleOnline,
  } = useRiderLocation();

  const region = useMemo<MapRegion | null>(() => {
    if (latitude == null || longitude == null) return null;

    return {
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }, [latitude, longitude]);

  useEffect(() => {
    if (region && !hasCenteredOnUser) {
      mapRef.current?.animateToRegion(region, 400);
      setHasCenteredOnUser(true);
    }
  }, [hasCenteredOnUser, region]);

  const centerOnMe = () => {
    if (latitude == null || longitude == null) {
      Alert.alert(
        "Waiting for location",
        "We are still waiting for your GPS position.",
      );
      return;
    }

    mapRef.current?.animateToRegion(
      {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      400,
    );
  };

  const handleToggleOnline = async () => {
    const nextOnline = await toggleOnline();
    if (!nextOnline && permissionStatus && permissionStatus !== "granted") {
      Alert.alert(
        "Location permission required",
        "Location permission is required for rider location tracking.",
      );
    }
  };

  const permissionBlocked =
    permissionStatus != null && permissionStatus !== "granted";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>My Location</Text>
          <Text style={styles.subtitle}>Your current delivery location</Text>
        </View>
        <View
          style={[
            styles.statusPill,
            online ? styles.statusPillOnline : styles.statusPillOffline,
          ]}
        >
          <Text style={styles.statusText}>{online ? "Online" : "Offline"}</Text>
        </View>
      </View>

      {permissionBlocked ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Location permission is required for rider location tracking.
          </Text>
          <Pressable
            onPress={() => void requestPermission()}
            style={styles.bannerButton}
          >
            <Text style={styles.bannerButtonText}>Retry permission</Text>
          </Pressable>
        </View>
      ) : null}

      {error ? <Text style={styles.warningText}>{error}</Text> : null}

      <View style={styles.mapCard}>
        {MapViewComponent ? (
          <MapViewComponent
            ref={mapRef}
            style={styles.map}
            initialRegion={defaultRegion}
            region={region ?? defaultRegion}
            showsCompass
            showsBuildings
            showsMyLocationButton={false}
          >
            {latitude != null && longitude != null && MarkerComponent ? (
              <MarkerComponent
                coordinate={{ latitude, longitude }}
                rotation={heading ?? 0}
                title="You"
                description={online ? "Online" : "Offline"}
              >
                <View style={styles.marker} />
              </MarkerComponent>
            ) : null}
          </MapViewComponent>
        ) : (
          <View style={styles.webFallback}>
            <Text style={styles.webFallbackTitle}>
              Map preview unavailable on web
            </Text>
            <Text style={styles.webFallbackText}>
              The rider map is available on the native app. Current coordinates
              are shown below.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.detailsTitle}>Current status</Text>
        <Text style={styles.detailsText}>
          {latitude != null && longitude != null
            ? `Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`
            : "Waiting for GPS signal..."}
        </Text>
        <Text style={styles.detailsText}>
          {heading != null
            ? `Heading: ${heading.toFixed(1)}°`
            : "Heading: unavailable"}
        </Text>
        <Text style={styles.detailsText}>
          {speed != null
            ? `Speed: ${speed.toFixed(1)} m/s`
            : "Speed: unavailable"}
        </Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          onPress={() => void handleToggleOnline()}
          style={[styles.primaryButton, online && styles.primaryButtonOffline]}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? "Updating..." : online ? "Go Offline" : "Go Online"}
          </Text>
        </Pressable>

        <Pressable onPress={centerOnMe} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Center on Me</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#176b87" />
          <Text style={styles.loadingText}>Updating rider location...</Text>
        </View>
      ) : null}

      {!permissionGranted && !permissionBlocked && !loading ? (
        <Pressable
          onPress={() => void requestPermission()}
          style={styles.permissionButton}
        >
          <Text style={styles.permissionButtonText}>
            Enable location access
          </Text>
        </Pressable>
      ) : null}

      {isTracking && !online ? (
        <Text style={styles.statusHint}>Tracking is active.</Text>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f8fa",
    padding: 18,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    color: "#1f2933",
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: "#66717f",
    fontSize: 14,
    marginTop: 4,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusPillOnline: {
    backgroundColor: "#ecfdf3",
  },
  statusPillOffline: {
    backgroundColor: "#edf2f6",
  },
  statusText: {
    color: "#1f2933",
    fontSize: 12,
    fontWeight: "700",
  },
  banner: {
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 12,
  },
  bannerText: {
    color: "#9a4d00",
    fontSize: 14,
    marginBottom: 8,
  },
  bannerButton: {
    alignSelf: "flex-start",
    backgroundColor: "#f97316",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bannerButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  mapCard: {
    backgroundColor: "#ffffff",
    borderColor: "#e8ebee",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  webFallback: {
    alignItems: "center",
    backgroundColor: "#edf2f6",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  webFallbackTitle: {
    color: "#1f2933",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  webFallbackText: {
    color: "#66717f",
    fontSize: 14,
    textAlign: "center",
  },
  marker: {
    backgroundColor: "#176b87",
    borderColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 3,
    height: 24,
    width: 24,
  },
  detailsCard: {
    backgroundColor: "#ffffff",
    borderColor: "#e8ebee",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  detailsTitle: {
    color: "#1f2933",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  detailsText: {
    color: "#66717f",
    fontSize: 14,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  primaryButton: {
    backgroundColor: "#176b87",
    borderRadius: 10,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryButtonOffline: {
    backgroundColor: "#b42318",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  secondaryButton: {
    backgroundColor: "#edf2f6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "#1f2933",
    fontSize: 14,
    fontWeight: "700",
  },
  loadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 12,
  },
  loadingText: {
    color: "#66717f",
    fontSize: 14,
  },
  permissionButton: {
    backgroundColor: "#0f766e",
    borderRadius: 10,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  permissionButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  warningText: {
    color: "#b42318",
    fontSize: 13,
    marginBottom: 12,
  },
  statusHint: {
    color: "#66717f",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
});
