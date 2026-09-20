import { supabase } from "@/lib/supabase";

type RealtimeEvent = {
  eventType: string;
  newRow: Record<string, unknown> | null;
  oldRow: Record<string, unknown> | null;
};

type RealtimeSubscription = {
  unsubscribe: () => void;
};

export function subscribeToRiderOrders(
  userId: string,
  onEvent: (event: RealtimeEvent) => void,
): RealtimeSubscription {
  const channel = supabase.channel(`rider-orders-${userId}`);

  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "orders",
      filter: `rider_id=eq.${userId}`,
    },
    (payload) => {
      onEvent({
        eventType: payload.eventType,
        newRow: (payload.new as Record<string, unknown> | null) ?? null,
        oldRow: (payload.old as Record<string, unknown> | null) ?? null,
      });
    },
  );

  channel.subscribe((status) => {
    if (__DEV__ && status !== "SUBSCRIBED") {
      console.info("Rider orders realtime status:", status);
    }
  });

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

export function subscribeToOrderById(
  orderId: string,
  onEvent: (event: RealtimeEvent) => void,
): RealtimeSubscription {
  const channel = supabase.channel(`rider-order-${orderId}`);

  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "orders",
      filter: `id=eq.${orderId}`,
    },
    (payload) => {
      onEvent({
        eventType: payload.eventType,
        newRow: (payload.new as Record<string, unknown> | null) ?? null,
        oldRow: (payload.old as Record<string, unknown> | null) ?? null,
      });
    },
  );

  channel.subscribe((status) => {
    if (__DEV__ && status !== "SUBSCRIBED") {
      console.info("Specific order realtime status:", status);
    }
  });

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

export function subscribeToUserNotifications(
  userId: string,
  onEvent: (event: RealtimeEvent) => void,
): RealtimeSubscription {
  const channel = supabase.channel(`user-notifications-${userId}`);

  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "notifications",
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      onEvent({
        eventType: payload.eventType,
        newRow: (payload.new as Record<string, unknown> | null) ?? null,
        oldRow: (payload.old as Record<string, unknown> | null) ?? null,
      });
    },
  );

  channel.subscribe((status) => {
    if (__DEV__ && status !== "SUBSCRIBED") {
      console.info("Notifications realtime status:", status);
    }
  });

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}
