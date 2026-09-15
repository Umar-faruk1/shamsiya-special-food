import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Check, ChevronDown, MapPin, Ticket } from "lucide-react-native";
import { AppHeader } from "../components/AppHeader";
import { PrimaryButton, SecondaryButton } from "../components/Buttons";
import {
  getCustomerOrdersForSupport,
  createSupportTicket,
} from "../api/supportTickets";
import { CustomerOrderForSupport } from "../types";
import { useApp } from "../context/AppContext";

const categories = [
  "Order Issue",
  "Delivery",
  "Payment",
  "Food Quality",
  "Account",
  "Other",
];

function money(value: number | string) {
  return `₵${Number(value).toFixed(2)}`;
}

export default function SupportTicketCreateScreen() {
  const router = useRouter();
  const { authUser, showToast } = useApp();
  const [category, setCategory] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [orders, setOrders] = useState<CustomerOrderForSupport[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authUser) {
      setOrdersLoading(false);
      return;
    }
    void getCustomerOrdersForSupport()
      .then(setOrders)
      .catch((error) => {
        console.error("Unable to load support orders:", error);
        setOrdersError(
          "Unable to load your orders. You can still submit without a related order.",
        );
      })
      .finally(() => setOrdersLoading(false));
  }, [authUser]);

  const submit = async () => {
    const trimmedSubject = subject.trim();
    const trimmedDescription = description.trim();
    if (!trimmedSubject) {
      Alert.alert(
        "Subject required",
        "Add a short subject for your support request.",
      );
      return;
    }
    if (trimmedSubject.length > 160) {
      Alert.alert("Subject too long", "Keep the subject under 160 characters.");
      return;
    }
    if (trimmedDescription.length < 10) {
      Alert.alert(
        "More detail needed",
        "Please describe the issue in at least 10 characters.",
      );
      return;
    }
    if (trimmedDescription.length > 4000) {
      Alert.alert(
        "Description too long",
        "Keep the description under 4000 characters.",
      );
      return;
    }
    setSubmitting(true);
    try {
      const ticket = await createSupportTicket({
        order_id: selectedOrderId,
        subject: trimmedSubject,
        description: trimmedDescription,
        category,
      });
      showToast("Support ticket created");
      router.replace({
        pathname: "/support-ticket-details",
        params: { ticketId: ticket.id },
      });
    } catch (error) {
      console.error("Unable to create support ticket:", error);
      Alert.alert(
        "Could not create ticket",
        "Please check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedOrder = orders.find((order) => order.id === selectedOrderId);

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader
        currentScreen="SupportTicketCreate"
        title="Create Support Ticket"
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
        <View className="flex-row items-center gap-3 rounded-3xl border border-[#E86A17]/25 bg-white p-4">
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#F4EFE6]">
            <Ticket width={19} height={19} color="#E86A17" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-black text-[#2D1810]">
              How can we help?
            </Text>
            <Text className="mt-1 text-xs text-[#8E7668]">
              Tell us what happened and our team will review your request.
            </Text>
          </View>
        </View>
        <View className="gap-2">
          <Text className="text-xs font-extrabold uppercase tracking-wider text-[#2D1810]">
            Category
          </Text>
          <Pressable
            onPress={() => setCategoryOpen((value) => !value)}
            className="flex-row items-center justify-between rounded-2xl border border-[#613D2D]/15 bg-white p-3.5"
          >
            <Text
              className={`text-xs ${category ? "font-bold text-[#2D1810]" : "text-[#8E7668]"}`}
            >
              {category || "Select a category"}
            </Text>
            <ChevronDown width={16} height={16} color="#8E7668" />
          </Pressable>
          {categoryOpen ? (
            <View className="overflow-hidden rounded-2xl border border-[#613D2D]/12 bg-white">
              {categories.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => {
                    setCategory(item);
                    setCategoryOpen(false);
                  }}
                  className="flex-row items-center justify-between border-b border-neutral-100 px-3.5 py-3"
                >
                  <Text className="text-xs font-semibold text-[#2D1810]">
                    {item}
                  </Text>
                  {category === item ? (
                    <Check width={15} height={15} color="#E86A17" />
                  ) : null}
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
        <View className="gap-2">
          <Text className="text-xs font-extrabold uppercase tracking-wider text-[#2D1810]">
            Subject
          </Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            maxLength={160}
            placeholder="Briefly describe the issue"
            placeholderTextColor="#A9998F"
            className="rounded-2xl border border-[#613D2D]/15 bg-white px-3.5 py-3 text-xs text-[#2D1810]"
          />
        </View>
        <View className="gap-2">
          <Text className="text-xs font-extrabold uppercase tracking-wider text-[#2D1810]">
            Description
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            maxLength={4000}
            multiline
            textAlignVertical="top"
            placeholder="Tell us more about what happened"
            placeholderTextColor="#A9998F"
            className="min-h-32 rounded-2xl border border-[#613D2D]/15 bg-white px-3.5 py-3 text-xs leading-relaxed text-[#2D1810]"
          />
        </View>
        <View className="gap-2">
          <Text className="text-xs font-extrabold uppercase tracking-wider text-[#2D1810]">
            Related Order (optional)
          </Text>
          {ordersLoading ? (
            <View className="flex-row items-center gap-2 rounded-2xl bg-white p-3.5">
              <ActivityIndicator size="small" color="#E86A17" />
              <Text className="text-xs text-[#8E7668]">Loading orders...</Text>
            </View>
          ) : (
            <>
              <Pressable
                onPress={() => setOrdersOpen((value) => !value)}
                className="flex-row items-center justify-between rounded-2xl border border-[#613D2D]/15 bg-white p-3.5"
              >
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-[#2D1810]">
                    {selectedOrder
                      ? `Order #${selectedOrder.order_number}`
                      : "No related order"}
                  </Text>
                  {selectedOrder ? (
                    <Text className="mt-1 text-[10px] text-[#8E7668]">
                      {selectedOrder.status} • {money(selectedOrder.total)}
                    </Text>
                  ) : null}
                </View>
                <ChevronDown width={16} height={16} color="#8E7668" />
              </Pressable>
              {ordersOpen ? (
                <View className="overflow-hidden rounded-2xl border border-[#613D2D]/12 bg-white">
                  <Pressable
                    onPress={() => {
                      setSelectedOrderId(null);
                      setOrdersOpen(false);
                    }}
                    className="border-b border-neutral-100 px-3.5 py-3"
                  >
                    <Text className="text-xs font-semibold text-[#2D1810]">
                      No related order
                    </Text>
                  </Pressable>
                  {orders.map((order) => (
                    <Pressable
                      key={order.id}
                      onPress={() => {
                        setSelectedOrderId(order.id);
                        setOrdersOpen(false);
                      }}
                      className="border-b border-neutral-100 px-3.5 py-3"
                    >
                      <View className="flex-row items-center gap-2">
                        <MapPin width={14} height={14} color="#E86A17" />
                        <Text className="text-xs font-semibold text-[#2D1810]">
                          Order #{order.order_number}
                        </Text>
                      </View>
                      <Text className="mt-1 text-[10px] text-[#8E7668]">
                        {order.status} • {money(order.total)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </>
          )}
          {ordersError ? (
            <Text className="text-[11px] text-amber-800">{ordersError}</Text>
          ) : null}
        </View>
        <View className="flex-row gap-2">
          <SecondaryButton fullWidth onPress={() => router.back()}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            fullWidth
            loading={submitting}
            onPress={() => void submit()}
          >
            Create Ticket
          </PrimaryButton>
        </View>
      </ScrollView>
    </View>
  );
}
