import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

const UPDATE_DISTANCE_METERS = 15;
const UPDATE_TIME_MS = 15000;

export type RiderLocationSnapshot = {
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  speed: number | null;
};

export function useRiderLocation() {
  const [location, setLocation] = useState<RiderLocationSnapshot>({
    latitude: null,
    longitude: null,
    heading: null,
    speed: null,
  });
  const [online, setOnlineState] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] =
    useState<Location.PermissionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const lastWriteRef = useRef<{
    at: number;
    latitude: number;
    longitude: number;
  } | null>(null);
  const mountedRef = useRef(true);

  const requestPermission = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const status = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status.status);

      if (status.status !== "granted") {
        setError(
          "Location permission is required for rider location tracking. Please enable it in Settings or try again.",
        );
        setLoading(false);
        return false;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setError("Location services are disabled on this device.");
        setLoading(false);
        return false;
      }

      setLoading(false);
      return true;
    } catch (requestError) {
      if (__DEV__)
        console.error("Unable to request location permission:", requestError);
      setError("Unable to access location right now. Please try again.");
      setLoading(false);
      return false;
    }
  }, []);

  const syncLocation = useCallback(
    async (nextLocation: Location.LocationObject, nextOnline: boolean) => {
      const latitude = nextLocation.coords.latitude;
      const longitude = nextLocation.coords.longitude;
      const heading = nextLocation.coords.heading;
      const speed = nextLocation.coords.speed;

      setLocation({
        latitude,
        longitude,
        heading: heading ?? null,
        speed: speed ?? null,
      });

      const now = Date.now();
      const lastWrite = lastWriteRef.current;
      const hasDistanceThreshold =
        lastWrite == null ||
        Math.hypot(
          latitude - lastWrite.latitude,
          longitude - lastWrite.longitude,
        ) >= UPDATE_DISTANCE_METERS;
      const hasTimeThreshold =
        lastWrite == null || now - lastWrite.at >= UPDATE_TIME_MS;

      if (!nextOnline) {
        // Always persist the final offline state.
      } else if (!hasDistanceThreshold && !hasTimeThreshold) {
        return;
      }

      try {
        const { error: rpcError } = await supabase.rpc(
          "update_rider_location",
          {
            latitude,
            longitude,
            heading: heading ?? null,
            speed: speed ?? null,
            is_online: nextOnline,
          },
        );

        if (rpcError) {
          throw rpcError;
        }

        lastWriteRef.current = { at: now, latitude, longitude };
        if (!mountedRef.current) return;
        setError(null);
      } catch (syncError) {
        if (__DEV__) console.error("Unable to sync rider location:", syncError);
        if (mountedRef.current) {
          setError(
            "Location update could not be saved. The next scheduled retry will try again.",
          );
        }
      }
    },
    [],
  );

  const stopTracking = useCallback(async () => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }

    setIsTracking(false);

    const latestLocation =
      location.latitude != null && location.longitude != null
        ? {
            coords: {
              latitude: location.latitude,
              longitude: location.longitude,
              heading: location.heading ?? null,
              speed: location.speed ?? null,
            },
          }
        : null;

    if (latestLocation) {
      await syncLocation(latestLocation as Location.LocationObject, false);
    }

    if (mountedRef.current) {
      setOnlineState(false);
    }
  }, [location, syncLocation]);

  const startTracking = useCallback(async () => {
    const permissionGranted = await requestPermission();
    if (!permissionGranted) {
      return false;
    }

    setLoading(true);
    setError(null);
    setOnlineState(true);

    try {
      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      await syncLocation(currentPosition, true);

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: UPDATE_TIME_MS,
          distanceInterval: UPDATE_DISTANCE_METERS,
        },
        (nextPosition) => {
          void syncLocation(nextPosition, true);
        },
      );

      watchRef.current = subscription;
      setIsTracking(true);
      setLoading(false);
      return true;
    } catch (trackError) {
      if (__DEV__) console.error("Unable to start rider tracking:", trackError);
      if (mountedRef.current) {
        setError("Unable to access the current device location right now.");
        setOnlineState(false);
      }
      setLoading(false);
      return false;
    }
  }, [requestPermission, syncLocation]);

  const toggleOnline = useCallback(async () => {
    if (online) {
      await stopTracking();
      return false;
    }

    const started = await startTracking();
    return started;
  }, [online, startTracking, stopTracking]);

  useEffect(() => {
    mountedRef.current = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!mountedRef.current || !data.user) return;
      void supabase
        .from("riders")
        .select("is_online")
        .eq("id", data.user.id)
        .maybeSingle()
        .then(({ data: rider }) => {
          if (mountedRef.current && rider)
            setOnlineState(Boolean(rider.is_online));
        });
    });
    void Location.getForegroundPermissionsAsync().then(({ status }) => {
      if (!mountedRef.current) return;
      setPermissionStatus(status);
    });

    return () => {
      mountedRef.current = false;
      if (watchRef.current) {
        watchRef.current.remove();
      }
    };
  }, []);

  return {
    latitude: location.latitude,
    longitude: location.longitude,
    heading: location.heading,
    speed: location.speed,
    loading,
    permissionStatus,
    permissionGranted: permissionStatus === "granted",
    error,
    online,
    isTracking,
    requestPermission,
    startTracking,
    stopTracking,
    toggleOnline,
  };
}
