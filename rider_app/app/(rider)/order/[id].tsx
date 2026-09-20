import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { subscribeToOrderById } from "@/lib/realtime";
import { supabase } from "@/lib/supabase";

export type Order = {
  id: string;
  order_number: string;
  customer_id: string;
  rider_id: string | null;
  status: string;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  payment_status: string;
  payment_method: string | null;
  address_id: string | null;
  delivery_address: string | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  customer_note: string | null;
  rider_note: string | null;
  delivery_pin: string | null;
  accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  selected_options: unknown | null;
  notes: string | null;
  created_at: string;
};

export type CustomerProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
};

export type OrderDetails = {
  order: Order;
  items: OrderItem[];
  customer: CustomerProfile | null;
};

const statusLabels: Record<string, string> = {
  rider_assigned: "Rider Assigned",
  rider_accepted: "Rider Accepted",
  picked_up: "Picked Up",
  out_for_delivery: "Out for Delivery",
  arrived: "Arrived",
  delivered: "Delivered",
};

const paymentMethodLabels: Record<string, string> = {
  cash: "Cash",
  mobile_money: "Mobile Money",
  card: "Card",
};

const paymentStatusLabels: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  successful: "Successful",
  failed: "Failed",
  refunded: "Refunded",
};

function formatMoney(value: number | null | undefined) {
  const safeValue = typeof value === "number" ? value : 0;
  return `GHS ${safeValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatLabel(
  value: string | null | undefined,
  map: Record<string, string>,
) {
  if (!value) return "Not available";
  return map[value] ?? value.replace(/_/g, " ");
}

function formatOptions(value: unknown): string | null {
  if (value == null) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }

  if (Array.isArray(value)) {
    const output = value
      .map((entry) => {
        if (typeof entry === "string") return entry.trim();
        if (entry && typeof entry === "object") {
          try {
            return JSON.stringify(entry);
          } catch {
            return null;
          }
        }
        return null;
      })
      .filter(Boolean)
      .join(", ");
    return output || null;
  }

  if (typeof value === "object") {
    try {
      const json = JSON.stringify(value);
      return json && json !== "{}" ? json : null;
    } catch {
      return null;
    }
  }

  return String(value);
}

export default function OrderDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const orderId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : null;

  const [details, setDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const loadOrder = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        if (!orderId) {
          setNotFound(true);
          return;
        }

        const { data: authData, error: authError } =
          await supabase.auth.getUser();
        if (authError) {
          throw authError;
        }

        const authenticatedUser = authData?.user;
        if (!authenticatedUser) {
          setError("Unable to load order");
          return;
        }

        const { data: order, error: orderError } = await supabase
          .from("orders")
          .select(
            "id, order_number, customer_id, rider_id, status, subtotal, delivery_fee, discount, total, payment_status, payment_method, address_id, delivery_address, delivery_latitude, delivery_longitude, customer_note, rider_note, delivery_pin, accepted_at, picked_up_at, delivered_at, created_at, updated_at",
          )
          .eq("id", orderId)
          .eq("rider_id", authenticatedUser.id)
          .maybeSingle();

        if (orderError) {
          throw orderError;
        }

        if (!order) {
          setNotFound(true);
          return;
        }

        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select(
            "id, order_id, menu_item_id, name, quantity, unit_price, total_price, selected_options, notes, created_at",
          )
          .eq("order_id", order.id)
          .order("created_at", { ascending: true });

        if (itemsError) {
          throw itemsError;
        }

        const { data: customerData, error: customerError } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone, avatar_url")
          .eq("id", order.customer_id)
          .maybeSingle();

        if (customerError) {
          throw customerError;
        }

        setDetails({
          order: order as Order,
          items: (itemsData ?? []) as OrderItem[],
          customer: (customerData as CustomerProfile | null) ?? null,
        });
      } catch (loadError) {
        if (__DEV__)
          console.error("Unable to load rider order details:", loadError);
        setError("Unable to load order");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orderId],
  );

  useFocusEffect(
    useCallback(() => {
      void loadOrder();
    }, [loadOrder]),
  );

  useEffect(() => {
    if (!orderId) return;

    const subscription = subscribeToOrderById(orderId, () => {
      void loadOrder(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadOrder, orderId]);

  const handleAcceptDelivery = useCallback(async () => {
    if (!details?.order || accepting || rejecting) return;

    setActionError(null);
    setAccepting(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError || !authData.user) {
        throw new Error("Authentication required");
      }

      const { data: updatedOrder, error: updateError } = await supabase
        .from("orders")
        .update({
          status: "rider_accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", details.order.id)
        .eq("rider_id", authData.user.id)
        .eq("status", "rider_assigned")
        .select()
        .single();

      if (updateError || !updatedOrder) {
        throw updateError ?? new Error("Order update failed");
      }

      setDetails((previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          order: {
            ...previous.order,
            ...updatedOrder,
            status: updatedOrder.status,
            accepted_at: updatedOrder.accepted_at ?? previous.order.accepted_at,
          },
        };
      });
    } catch (acceptError) {
      if (__DEV__)
        console.error("Unable to accept rider delivery:", acceptError);
      setActionError(
        "Unable to accept this delivery. The order may have already been updated.",
      );
    } finally {
      setAccepting(false);
    }
  }, [accepting, details, rejecting]);

  const handleRejectDelivery = useCallback(async () => {
    if (!details?.order || accepting || rejecting) return;

    setActionError(null);
    setRejecting(true);

    try {
      const { data, error } = await supabase.rpc("reject_rider_order", {
        p_order_id: details.order.id,
      });

      if (error) {
        throw error;
      }

      const payload = data as {
        success?: boolean;
        status?: string;
        rider_id?: string | null;
      } | null;

      if (!payload || payload.success !== true) {
        throw new Error("Reject RPC did not report success");
      }

      setDetails((previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          order: {
            ...previous.order,
            status: payload.status ?? "ready_for_pickup",
            rider_id: payload.rider_id ?? null,
          },
        };
      });
    } catch (rejectError) {
      if (__DEV__)
        console.error("Unable to reject rider delivery:", rejectError);
      setActionError(
        "Unable to reject this delivery. The order may have already been updated.",
      );
    } finally {
      setRejecting(false);
    }
  }, [accepting, details, rejecting]);

  const confirmRejectDelivery = useCallback(() => {
    Alert.alert(
      "Reject Delivery?",
      "Are you sure you want to reject this delivery? The order will be returned for rider assignment.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => {
            void handleRejectDelivery();
          },
        },
      ],
      { cancelable: true },
    );
  }, [handleRejectDelivery]);

  const handleStatusTransition = useCallback(
    async (
      nextStatus: string,
      expectedStatus: string,
      updateData: Record<string, string | null | undefined>,
    ) => {
      if (!details?.order) return;

      setActionError(null);
      setStatusUpdating(true);

      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();
        if (authError || !authData.user) {
          throw new Error("Authentication required");
        }

        const { data: updatedOrder, error: updateError } = await supabase
          .from("orders")
          .update(updateData)
          .eq("id", details.order.id)
          .eq("rider_id", authData.user.id)
          .eq("status", expectedStatus)
          .select()
          .single();

        if (updateError || !updatedOrder) {
          throw updateError ?? new Error("Status update failed");
        }

        setDetails((previous) => {
          if (!previous) return previous;
          return {
            ...previous,
            order: {
              ...previous.order,
              ...updatedOrder,
              status: updatedOrder.status,
              picked_up_at:
                updatedOrder.picked_up_at ?? previous.order.picked_up_at,
              delivered_at:
                updatedOrder.delivered_at ?? previous.order.delivered_at,
            },
          };
        });
      } catch (updateError) {
        if (__DEV__)
          console.error("Unable to update delivery status:", updateError);
        setActionError(
          "This order has already been updated. Refreshing the latest status.",
        );
        await loadOrder(true);
      } finally {
        setStatusUpdating(false);
      }
    },
    [details, loadOrder],
  );

  const statusActionConfig = (() => {
    if (!details?.order) return null;

    switch (details.order.status) {
      case "rider_accepted":
        return {
          actionLabel: "Picked Up",
          nextStatus: "picked_up",
          currentStatus: "rider_accepted",
          buttonText: "Picked Up",
          confirmTitle: "Confirm Pickup",
          confirmMessage: "Have you picked up this order from the restaurant?",
          confirmButton: "Confirm Pickup",
          updateData: {
            status: "picked_up",
            picked_up_at: new Date().toISOString(),
          },
        };
      case "picked_up":
        return {
          actionLabel: "Start Delivery",
          nextStatus: "out_for_delivery",
          currentStatus: "picked_up",
          buttonText: "Start Delivery",
          confirmTitle: "Start Delivery",
          confirmMessage: "Start the delivery for this order?",
          confirmButton: "Start Delivery",
          updateData: {
            status: "out_for_delivery",
          },
        };
      case "out_for_delivery":
        return {
          actionLabel: "Arrived",
          nextStatus: "arrived",
          currentStatus: "out_for_delivery",
          buttonText: "Arrived",
          confirmTitle: "Arrival Update",
          confirmMessage: "Have you arrived at the customer location?",
          confirmButton: "Arrived",
          updateData: {
            status: "arrived",
          },
        };
      case "arrived":
        return {
          actionLabel: "Mark as Delivered",
          nextStatus: "delivered",
          currentStatus: "arrived",
          buttonText: "Mark as Delivered",
          confirmTitle: "Complete Delivery",
          confirmMessage:
            "Are you sure you want to mark this order as delivered?",
          confirmButton: "Mark as Delivered",
          updateData: {
            status: "delivered",
            delivered_at: new Date().toISOString(),
          },
        };
      case "delivered":
        return {
          actionLabel: "Delivery Completed",
          nextStatus: null,
          currentStatus: null,
          buttonText: "Delivery Completed",
          confirmTitle: "",
          confirmMessage: "",
          confirmButton: "",
          updateData: {},
        };
      default:
        return null;
    }
  })();

  const handleStatusButtonPress = useCallback(() => {
    if (!statusActionConfig) return;
    const config = statusActionConfig;
    if (!config.confirmTitle) return;

    Alert.alert(
      config.confirmTitle,
      config.confirmMessage ?? "",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: config.confirmButton || config.buttonText,
          onPress: () => {
            if (
              config.nextStatus &&
              config.currentStatus &&
              config.updateData
            ) {
              void handleStatusTransition(
                config.nextStatus,
                config.currentStatus,
                config.updateData,
              );
            }
          },
        },
      ],
      { cancelable: true },
    );
  }, [handleStatusTransition, statusActionConfig]);

  const statusText = details?.order
    ? (statusLabels[details.order.status] ??
      details.order.status.replace(/_/g, " "))
    : "";

  const customerName = details?.customer?.full_name?.trim() || "Customer";
  const deliveryAddress =
    details?.order.delivery_address?.trim() || "Address not available";
  const customerEmail =
    details?.customer?.email?.trim() || "Email not available";
  const customerPhone =
    details?.customer?.phone?.trim() || "Phone not available";
  const customerNote = details?.order.customer_note?.trim() || null;
  const riderNote = details?.order.rider_note?.trim() || null;
  const deliveryPin = details?.order.delivery_pin?.trim() || null;

  if (loading) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator color="#f26a21" size="large" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.errorTitle}>Unable to load order</Text>
        <Text style={styles.errorText}>
          This order could not be found or is no longer available.
        </Text>
        <Pressable onPress={() => router.back()} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Back to Orders</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (notFound || !details) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.errorTitle}>Order Not Found</Text>
        <Text style={styles.errorText}>
          This order is not available or is not assigned to you.
        </Text>
        <Pressable onPress={() => router.back()} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Return to Orders</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={["#f26a21"]}
            onRefresh={() => void loadOrder(true)}
            refreshing={refreshing}
            tintColor="#f26a21"
          />
        }
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>

        <View style={styles.headerCard}>
          <Text style={styles.orderNumber}>
            Order #{details.order.order_number}
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>

        {details.order.status === "rider_assigned" ? (
          <View style={styles.actionCard}>
            <Text style={styles.sectionTitle}>Delivery Action</Text>
            <View style={styles.actionRow}>
              <Pressable
                onPress={() => void handleAcceptDelivery()}
                disabled={accepting || rejecting || statusUpdating}
                style={[
                  styles.primaryAction,
                  (accepting || rejecting || statusUpdating) &&
                    styles.disabledAction,
                ]}
              >
                <Text style={styles.primaryActionText}>
                  {accepting ? "Accepting..." : "Accept Delivery"}
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmRejectDelivery}
                disabled={accepting || rejecting || statusUpdating}
                style={[
                  styles.secondaryAction,
                  (accepting || rejecting || statusUpdating) &&
                    styles.disabledAction,
                ]}
              >
                <Text style={styles.secondaryActionText}>
                  {rejecting ? "Rejecting..." : "Reject Delivery"}
                </Text>
              </Pressable>
            </View>
            {actionError ? (
              <Text style={styles.actionErrorText}>{actionError}</Text>
            ) : null}
          </View>
        ) : statusActionConfig ? (
          <View style={styles.actionCard}>
            <Text style={styles.sectionTitle}>Delivery Status</Text>
            {statusActionConfig.nextStatus ? (
              <Pressable
                onPress={handleStatusButtonPress}
                disabled={statusUpdating || accepting || rejecting}
                style={[
                  styles.primaryAction,
                  (statusUpdating || accepting || rejecting) &&
                    styles.disabledAction,
                ]}
              >
                <Text style={styles.primaryActionText}>
                  {statusUpdating
                    ? "Updating..."
                    : statusActionConfig.buttonText}
                </Text>
              </Pressable>
            ) : (
              <View style={styles.completedBanner}>
                <Text style={styles.completedText}>Delivery Completed</Text>
              </View>
            )}
            {actionError ? (
              <Text style={styles.actionErrorText}>{actionError}</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.customerRow}>
            <Image
              source={
                details.customer?.avatar_url
                  ? { uri: details.customer.avatar_url }
                  : require("../../../assets/images/icon.png")
              }
              style={styles.avatar}
            />
            <View style={styles.customerMeta}>
              <Text style={styles.customerName}>{customerName}</Text>
              <Text style={styles.metaText}>{customerEmail}</Text>
              <Text style={styles.metaText}>{customerPhone}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <Text style={styles.valueText}>{deliveryAddress}</Text>

          {details.order.delivery_latitude != null &&
          details.order.delivery_longitude != null ? (
            <View style={styles.coordinatesBox}>
              <Text style={styles.metaLabel}>Coordinates</Text>
              <Text style={styles.metaText}>
                {details.order.delivery_latitude},{" "}
                {details.order.delivery_longitude}
              </Text>
            </View>
          ) : null}

          {deliveryPin ? (
            <View style={styles.noteBlock}>
              <Text style={styles.metaLabel}>Delivery PIN</Text>
              <Text style={styles.valueText}>{deliveryPin}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {details.items.length > 0 ? (
            details.items.map((item) => {
              const optionText = formatOptions(item.selected_options);
              const itemTotal = formatMoney(item.total_price);
              const unitPrice = formatMoney(item.unit_price);

              return (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>
                      {item.name || "Unnamed item"}
                    </Text>
                    <Text style={styles.itemTotal}>{itemTotal}</Text>
                  </View>
                  <Text style={styles.itemMeta}>
                    {item.quantity} × {unitPrice}
                  </Text>
                  {item.notes ? (
                    <Text style={styles.itemNotes}>{item.notes}</Text>
                  ) : null}
                  {optionText ? (
                    <Text style={styles.itemOptions}>
                      Options: {optionText}
                    </Text>
                  ) : null}
                </View>
              );
            })
          ) : (
            <Text style={styles.metaText}>No item information available.</Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Method</Text>
            <Text style={styles.summaryValue}>
              {formatLabel(details.order.payment_method, paymentMethodLabels)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Status</Text>
            <Text style={styles.summaryValue}>
              {formatLabel(details.order.payment_status, paymentStatusLabels)}
            </Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              {formatMoney(details.order.subtotal)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>
              {formatMoney(details.order.delivery_fee)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={styles.summaryValue}>
              {formatMoney(details.order.discount)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {formatMoney(details.order.total)}
            </Text>
          </View>
        </View>

        {customerNote ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Customer Note</Text>
            <Text style={styles.valueText}>{customerNote}</Text>
          </View>
        ) : null}

        {riderNote ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Rider Note</Text>
            <Text style={styles.valueText}>{riderNote}</Text>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Information</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Order number</Text>
            <Text style={styles.summaryValue}>
              {details.order.order_number}
            </Text>
          </View>

          {details.order.created_at ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Created</Text>
              <Text style={styles.summaryValue}>
                {formatDate(details.order.created_at) ?? "Not available"}
              </Text>
            </View>
          ) : null}

          {details.order.accepted_at ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Accepted</Text>
              <Text style={styles.summaryValue}>
                {formatDate(details.order.accepted_at) ?? "Not available"}
              </Text>
            </View>
          ) : null}

          {details.order.picked_up_at ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Picked Up</Text>
              <Text style={styles.summaryValue}>
                {formatDate(details.order.picked_up_at) ?? "Not available"}
              </Text>
            </View>
          ) : null}

          {details.order.delivered_at ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivered</Text>
              <Text style={styles.summaryValue}>
                {formatDate(details.order.delivered_at) ?? "Not available"}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f7f7f5" },
  content: { padding: 20, paddingBottom: 40 },
  centeredContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f7f7f5",
  },
  loadingText: { color: "#66717f", fontSize: 16, marginTop: 12 },
  errorTitle: {
    color: "#1f2933",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  errorText: { color: "#66717f", fontSize: 15, textAlign: "center" },
  primaryButton: {
    backgroundColor: "#f26a21",
    borderRadius: 10,
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  primaryButtonText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
  backButton: { marginBottom: 14 },
  backButtonText: { color: "#f26a21", fontSize: 16, fontWeight: "600" },
  actionCard: {
    backgroundColor: "#ffffff",
    borderColor: "#e8ebee",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryAction: {
    backgroundColor: "#f26a21",
    borderRadius: 10,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryActionText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  secondaryAction: {
    backgroundColor: "#fff3eb",
    borderColor: "#f3d4bf",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryActionText: {
    color: "#c45a24",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  disabledAction: {
    opacity: 0.6,
  },
  actionErrorText: {
    color: "#b42318",
    fontSize: 13,
    marginTop: 12,
  },
  completedBanner: {
    backgroundColor: "#edf6ec",
    borderColor: "#c8e7d0",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  completedText: {
    color: "#1f7a3d",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  headerCard: {
    alignItems: "flex-start",
    backgroundColor: "#ffffff",
    borderColor: "#e1e5e9",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    padding: 18,
  },
  orderNumber: { color: "#1f2933", flex: 1, fontSize: 20, fontWeight: "700" },
  statusBadge: {
    backgroundColor: "#eaf5ff",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: { color: "#1e5f9b", fontSize: 12, fontWeight: "700" },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderColor: "#e8ebee",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
  },
  sectionTitle: {
    color: "#1f2933",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  customerRow: { alignItems: "center", flexDirection: "row" },
  avatar: {
    backgroundColor: "#edf2f6",
    borderRadius: 28,
    height: 56,
    marginRight: 14,
    width: 56,
  },
  customerMeta: { flex: 1 },
  customerName: { color: "#1f2933", fontSize: 18, fontWeight: "700" },
  metaText: { color: "#66717f", fontSize: 14, marginTop: 4 },
  metaLabel: { color: "#89939f", fontSize: 12, marginBottom: 4 },
  valueText: { color: "#1f2933", fontSize: 15, lineHeight: 22 },
  coordinatesBox: { marginTop: 12 },
  noteBlock: { marginTop: 12 },
  itemCard: {
    borderBottomColor: "#eef1f4",
    borderBottomWidth: 1,
    paddingBottom: 12,
    paddingTop: 12,
  },
  itemHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemName: {
    color: "#1f2933",
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    marginRight: 12,
  },
  itemTotal: { color: "#1f2933", fontSize: 15, fontWeight: "700" },
  itemMeta: { color: "#66717f", fontSize: 13, marginTop: 4 },
  itemNotes: { color: "#66717f", fontSize: 13, marginTop: 6 },
  itemOptions: { color: "#66717f", fontSize: 12, marginTop: 6 },
  summaryRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: { color: "#66717f", fontSize: 14 },
  summaryValue: { color: "#1f2933", fontSize: 14, fontWeight: "600" },
  totalRow: {
    borderTopColor: "#e8ebee",
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 10,
  },
  totalLabel: { color: "#1f2933", fontSize: 16, fontWeight: "700" },
  totalValue: { color: "#1f2933", fontSize: 16, fontWeight: "700" },
});
