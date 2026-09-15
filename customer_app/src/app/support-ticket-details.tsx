import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Calendar, CircleHelp, MapPin, Ticket } from "lucide-react-native";
import { AppHeader } from "../components/AppHeader";
import { ErrorState } from "../components/CommonModalsAndCards";
import { getSupportOrder, getSupportTicket } from "../api/supportTickets";
import {
  CustomerOrderForSupport,
  SupportTicket,
  SupportTicketStatus,
} from "../types";

const statusLabels: Record<SupportTicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};
function statusStyle(status: SupportTicketStatus) {
  if (status === "resolved") return "bg-emerald-100 text-emerald-800";
  if (status === "closed") return "bg-neutral-200 text-neutral-700";
  if (status === "in_progress") return "bg-amber-100 text-amber-900";
  return "bg-orange-100 text-orange-800";
}
function date(value: string) {
  return new Date(value).toLocaleString();
}
function money(value: number | string) {
  return `₵${Number(value).toFixed(2)}`;
}

export default function SupportTicketDetailsScreen() {
  const { ticketId } = useLocalSearchParams<{ ticketId?: string }>();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [order, setOrder] = useState<CustomerOrderForSupport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!ticketId) {
      setError("This support ticket could not be found.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const nextTicket = await getSupportTicket(ticketId);
      setTicket(nextTicket);
      setOrder(
        nextTicket.order_id ? await getSupportOrder(nextTicket.order_id) : null,
      );
    } catch (loadError) {
      console.error("Unable to load support ticket:", loadError);
      setError("Unable to load this support ticket.");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader
        currentScreen="SupportTicketDetails"
        title="Support Ticket"
        showBack
      />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: 40,
          gap: 14,
        }}
      >
        {loading ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color="#E86A17" />
            <Text className="mt-3 text-xs text-[#8E7668]">
              Loading ticket...
            </Text>
          </View>
        ) : null}
        {error ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : null}
        {!loading && !error && ticket ? (
          <>
            <View className="rounded-3xl border border-[#E86A17]/25 bg-white p-4">
              <View className="flex-row items-start gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#F4EFE6]">
                  <Ticket width={19} height={19} color="#E86A17" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-black text-[#2D1810]">
                    {ticket.subject}
                  </Text>
                  <View
                    className={`mt-2 self-start rounded-full px-2.5 py-1 ${statusStyle(ticket.status).split(" ")[0]}`}
                  >
                    <Text
                      className={`text-[10px] font-bold ${statusStyle(ticket.status).split(" ")[1]}`}
                    >
                      {statusLabels[ticket.status]}
                    </Text>
                  </View>
                </View>
              </View>
              <Text className="mt-4 text-xs leading-relaxed text-[#613D2D]">
                {ticket.description}
              </Text>
            </View>
            <View className="gap-3 rounded-3xl border border-[#613D2D]/12 bg-white p-4">
              <Text className="text-xs font-extrabold uppercase tracking-wider text-[#2D1810]">
                Ticket information
              </Text>
              <View className="flex-row items-center gap-2">
                <CircleHelp width={15} height={15} color="#E86A17" />
                <Text className="text-xs text-[#613D2D]">
                  Category: {ticket.category || "General support"}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Calendar width={15} height={15} color="#E86A17" />
                <Text className="text-xs text-[#613D2D]">
                  Created: {date(ticket.created_at)}
                </Text>
              </View>
              <Text className="text-[11px] text-[#8E7668]">
                Updated: {date(ticket.updated_at)}
              </Text>
            </View>
            {order ? (
              <View className="gap-3 rounded-3xl border border-[#613D2D]/12 bg-white p-4">
                <Text className="text-xs font-extrabold uppercase tracking-wider text-[#2D1810]">
                  Related order
                </Text>
                <View className="flex-row items-start gap-2">
                  <MapPin width={16} height={16} color="#E86A17" />
                  <View>
                    <Text className="text-sm font-extrabold text-[#2D1810]">
                      Order #{order.order_number}
                    </Text>
                    <Text className="mt-1 text-xs text-[#8E7668]">
                      {order.status} • {money(order.total)}
                    </Text>
                    <Text className="mt-1 text-[10px] text-[#8E7668]">
                      {date(order.created_at)}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}
            <Text className="text-center text-[11px] text-[#8E7668]">
              Ticket status is managed by Customer Care.
            </Text>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
