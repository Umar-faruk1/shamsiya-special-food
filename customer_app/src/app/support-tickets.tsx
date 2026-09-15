import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, CircleHelp, Plus, Ticket } from "lucide-react-native";
import { AppHeader } from "../components/AppHeader";
import { EmptyState, ErrorState } from "../components/CommonModalsAndCards";
import { PrimaryButton } from "../components/Buttons";
import { getSupportTickets } from "../api/supportTickets";
import { SupportTicket, SupportTicketStatus } from "../types";
import { useApp } from "../context/AppContext";

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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

export default function SupportTicketsScreen() {
  const router = useRouter();
  const { authUser } = useApp();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    if (!authUser) {
      setTickets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setTickets(await getSupportTickets());
    } catch (loadError) {
      console.error("Unable to load support tickets:", loadError);
      setError("Unable to load your support tickets.");
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader
        currentScreen="SupportTickets"
        title="My Support Tickets"
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
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-lg font-black text-[#2D1810]">
              My Support Tickets
            </Text>
            <Text className="mt-1 text-xs leading-relaxed text-[#8E7668]">
              Track requests and conversations with Shamsiya Customer Care.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/support-ticket-create")}
            className="flex-row items-center gap-1 rounded-xl bg-[#2D1810] px-3 py-2"
          >
            <Plus width={14} height={14} color="#fff" />
            <Text className="text-xs font-bold text-white">Create</Text>
          </Pressable>
        </View>
        {loading ? (
          <View className="items-center py-10">
            <ActivityIndicator size="large" color="#E86A17" />
            <Text className="mt-3 text-xs text-[#8E7668]">
              Loading tickets...
            </Text>
          </View>
        ) : null}
        {error ? (
          <ErrorState message={error} onRetry={() => void loadTickets()} />
        ) : null}
        {!loading && !error && tickets.length === 0 ? (
          <EmptyState
            icon={<Ticket width={32} height={32} color="#E86A17" />}
            title="No support tickets yet"
            description="You haven't contacted customer support about an issue yet."
            actionText="Create Support Ticket"
            onAction={() => router.push("/support-ticket-create")}
          />
        ) : null}
        {!loading && !error ? (
          <View className="gap-3">
            {tickets.map((ticket) => (
              <Pressable
                key={ticket.id}
                onPress={() =>
                  router.push({
                    pathname: "/support-ticket-details",
                    params: { ticketId: ticket.id },
                  })
                }
                className="rounded-3xl border border-[#613D2D]/12 bg-white p-4"
              >
                <View className="flex-row items-start gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#F4EFE6]">
                    <CircleHelp width={19} height={19} color="#E86A17" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-start justify-between gap-2">
                      <Text className="flex-1 text-sm font-extrabold text-[#2D1810]">
                        {ticket.subject}
                      </Text>
                      <View
                        className={`rounded-full px-2 py-1 ${statusStyle(ticket.status).split(" ")[0]}`}
                      >
                        <Text
                          className={`text-[10px] font-bold ${statusStyle(ticket.status).split(" ")[1]}`}
                        >
                          {statusLabels[ticket.status]}
                        </Text>
                      </View>
                    </View>
                    <Text
                      numberOfLines={2}
                      className="mt-1 text-xs leading-relaxed text-[#8E7668]"
                    >
                      {ticket.description}
                    </Text>
                    <View className="mt-3 flex-row items-center justify-between">
                      <Text className="text-[10px] text-[#613D2D]">
                        {ticket.category || "General support"} •{" "}
                        {formatDate(ticket.created_at)}
                      </Text>
                      <ChevronRight width={16} height={16} color="#8E7668" />
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}
        {!loading && !error && tickets.length > 0 ? (
          <PrimaryButton
            fullWidth
            onPress={() => router.push("/support-ticket-create")}
            icon={<Plus width={16} height={16} color="#fff" />}
          >
            Create Support Ticket
          </PrimaryButton>
        ) : null}
      </ScrollView>
    </View>
  );
}
