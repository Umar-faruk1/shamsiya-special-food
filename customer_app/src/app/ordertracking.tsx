import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  TextInput,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  Store,
  Navigation,
  Send,
} from "lucide-react-native";
import { OrderStatusStep } from "../types";
import { OrderTimeline, RiderCard } from "../components/CartAndOrderWidgets";
import { StatusBadge } from "../components/BadgesAndRatings";
import { BottomSheet } from "../components/CommonModalsAndCards";
import { AppHeader } from "../components/AppHeader";
import { useApp } from "../context/AppContext";

const steps: OrderStatusStep[] = [
  {
    status: "confirmed",
    label: "Order Confirmed",
    timestamp: "12:45 PM",
    description: "Payment verified and sent to master kitchen.",
    completed: true,
    current: false,
  },
  {
    status: "preparing",
    label: "Kitchen Cooking & Searing",
    timestamp: "12:52 PM",
    description: "Slow dum cooking and fire roasting fresh skewers.",
    completed: true,
    current: false,
  },
  {
    status: "picked_up",
    label: "Packed in Insulated Thermal Box",
    timestamp: "01:05 PM",
    description: "Quality sealed with fresh garnishes.",
    completed: true,
    current: false,
  },
  {
    status: "on_the_way",
    label: "Out for Delivery with Rider",
    timestamp: "01:10 PM",
    description: "Rider on transit via electric courier motorbike.",
    completed: false,
    current: true,
  },
  {
    status: "delivered",
    label: "Delivered to Doorstep",
    timestamp: "Estimated 01:25 PM",
    description: "Fresh and piping hot handoff.",
    completed: false,
    current: false,
  },
];

// Direct port of OrderTrackingScreen.tsx. The web's animated SVG road map
// becomes a simplified stylized panel with an animated courier marker
// (full native maps would use react-native-maps in a production build).
export default function OrderTrackingScreen() {
  const navigation = useRouter();
  const { activeTrackingOrder: order } = useApp();
  const rider = order?.rider;

  const [showItems, setShowItems] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    { sender: "rider" | "user"; text: string }[]
  >([
    {
      sender: "rider",
      text: "Hi! I've picked up your fresh hot order from Shamsiya Special Food kitchen. On my way to your address!",
    },
  ]);
  const [riderInput, setRiderInput] = useState("");
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [riderProgress, setRiderProgress] = useState(65);

  useEffect(() => {
    const timer = setInterval(() => {
      setRiderProgress((prev) => (prev < 90 ? prev + 1 : prev));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  if (!order || !rider) {
    return (
      <View className="flex-1 bg-[#F7F4EE]">
        <AppHeader
          currentScreen="OrderTracking"
          title="Order Tracking"
          showBack
        />
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-xs text-[#8E7668]">
            No active order to track.
          </Text>
        </View>
      </View>
    );
  }

  const handleSendMessage = () => {
    if (!riderInput.trim()) return;
    setChatMessages((prev) => [...prev, { sender: "user", text: riderInput }]);
    setRiderInput("");
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "rider",
          text: "Got it! Arriving in about 8 minutes. See you soon!",
        },
      ]);
    }, 1500);
  };

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader
        currentScreen="OrderTracking"
        title="Order Tracking"
        showBack
      />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: 48,
          gap: 16,
        }}
      >
        {/* 1. STYLIZED LIVE MAP */}
        <View className="relative w-full h-56 rounded-3xl overflow-hidden bg-[#24292e] border border-[#613D2D]/20">
          <View className="absolute top-8 left-8 items-center">
            <View className="w-8 h-8 rounded-full bg-[#2D1810] border-2 border-white items-center justify-center">
              <Store width={16} height={16} color="#FFA028" />
            </View>
            <Text className="text-[9px] font-extrabold text-white bg-black/60 px-1.5 py-0.5 rounded-md mt-1">
              Shamsiya Kitchen
            </Text>
          </View>

          <View className="absolute bottom-8 right-8 items-center">
            <View className="w-8 h-8 rounded-full bg-[#E86A17] border-2 border-white items-center justify-center">
              <MapPin width={16} height={16} color="#fff" />
            </View>
            <Text className="text-[9px] font-extrabold text-white bg-black/60 px-1.5 py-0.5 rounded-md mt-1">
              Your Home
            </Text>
          </View>

          <View
            className="absolute items-center"
            style={{ top: "38%", left: `${riderProgress}%` }}
          >
            <View className="w-10 h-10 rounded-full bg-emerald-500 border-2 border-white items-center justify-center">
              <Navigation width={20} height={20} color="#fff" fill="#fff" />
            </View>
            <Text className="text-[9px] font-black text-black bg-white px-2 py-0.5 rounded-full mt-1">
              {rider.name.split(" ")[0]} ({100 - riderProgress} mins)
            </Text>
          </View>

          <View className="absolute top-3 right-3 bg-white/90 px-3 py-1.5 rounded-2xl border border-[#613D2D]/10 flex-row items-center gap-1.5">
            <Clock width={16} height={16} color="#E86A17" />
            <View>
              <Text className="text-[10px] text-[#8E7668]">ETA Arrival</Text>
              <Text className="text-xs font-bold text-[#2D1810]">
                {order.estimatedDeliveryTime || "15–20 mins"}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. RIDER CONTACT */}
        <RiderCard
          rider={rider}
          onCall={() => setIsCallOpen(true)}
          onMessage={() => setIsChatOpen(true)}
        />

        {/* 3. LIVE STATUS STEPPER */}
        <View className="bg-white p-4 rounded-3xl border border-[#613D2D]/12 gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-extrabold text-[#2D1810] uppercase tracking-wider">
              Live Order Status
            </Text>
            <StatusBadge status={order.status} />
          </View>

          <OrderTimeline steps={steps} />
        </View>

        {/* 4. EXPANDABLE RECEIPT */}
        <View className="bg-white rounded-3xl border border-[#613D2D]/12 overflow-hidden">
          <Pressable
            onPress={() => setShowItems(!showItems)}
            className="p-4 flex-row items-center justify-between"
          >
            <View>
              <Text className="text-xs font-extrabold text-[#2D1810]">
                Order #{order.orderNumber} Receipt
              </Text>
              <Text className="text-[10px] text-[#8E7668]">
                {order.items.length} items • ${order.total.toFixed(2)} total
              </Text>
            </View>
            {showItems ? (
              <ChevronUp width={16} height={16} color="#8E7668" />
            ) : (
              <ChevronDown width={16} height={16} color="#8E7668" />
            )}
          </Pressable>

          {showItems ? (
            <View className="p-4 pt-0 border-t border-neutral-100 gap-2">
              {order.items.map((it, idx) => (
                <View
                  key={idx}
                  className="flex-row items-center justify-between py-1"
                >
                  <View className="flex-row items-center gap-2">
                    <Text className="font-bold text-[#E86A17] text-xs">
                      {it.quantity}x
                    </Text>
                    <Text className="text-[#2D1810] text-xs">
                      {it.food.name}
                    </Text>
                  </View>
                  <Text className="font-bold text-[#2D1810] text-xs">
                    ${it.itemTotalPrice.toFixed(2)}
                  </Text>
                </View>
              ))}

              <View className="pt-2 border-t border-dashed border-neutral-200 gap-1">
                <View className="flex-row justify-between">
                  <Text className="text-xs text-[#613D2D]">Subtotal</Text>
                  <Text className="text-xs text-[#613D2D]">
                    ${order.subtotal.toFixed(2)}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-[#613D2D]">
                    Delivery & Fees
                  </Text>
                  <Text className="text-xs text-[#613D2D]">
                    ${(order.deliveryFee + order.tax).toFixed(2)}
                  </Text>
                </View>
                {order.tip ? (
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-[#613D2D]">Rider Tip</Text>
                    <Text className="text-xs text-[#613D2D]">
                      ${order.tip.toFixed(2)}
                    </Text>
                  </View>
                ) : null}
                <View className="flex-row justify-between pt-1">
                  <Text className="font-black text-sm text-[#2D1810]">
                    Total Paid
                  </Text>
                  <Text className="font-black text-sm text-[#E86A17]">
                    ${order.total.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* RIDER CHAT MODAL */}
      <BottomSheet
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        title={`Message Rider (${rider.name})`}
      >
        <View style={{ height: 280 }} className="justify-between">
          <ScrollView className="flex-1" contentContainerStyle={{ gap: 8 }}>
            {chatMessages.map((msg, i) => (
              <View
                key={i}
                className={`flex-row ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <View
                  className={`p-3 rounded-2xl max-w-[80%] ${
                    msg.sender === "user" ? "bg-[#2D1810]" : "bg-[#F4EFE6]"
                  }`}
                >
                  <Text
                    className={`text-xs leading-relaxed ${
                      msg.sender === "user" ? "text-white" : "text-[#2D1810]"
                    }`}
                  >
                    {msg.text}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View className="flex-row gap-2 pt-2">
            <TextInput
              value={riderInput}
              onChangeText={setRiderInput}
              placeholder="e.g. Please leave at front door..."
              placeholderTextColor="rgba(142,118,104,0.6)"
              className="flex-1 text-xs px-3 py-2 rounded-xl bg-white border border-[#613D2D]/15 text-[#2D1810]"
              onSubmitEditing={handleSendMessage}
            />
            <Pressable
              onPress={handleSendMessage}
              className="px-3 py-2 rounded-xl bg-[#E86A17] items-center justify-center"
            >
              <Send width={14} height={14} color="#fff" />
            </Pressable>
          </View>
        </View>
      </BottomSheet>

      {/* RIDER CALL MODAL */}
      <BottomSheet
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        title={`Calling ${rider.name}`}
      >
        <View className="items-center py-6 gap-3">
          <Image
            source={{ uri: rider.avatar }}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              borderWidth: 4,
              borderColor: "rgba(232,106,23,0.3)",
            }}
          />
          <View className="items-center">
            <Text className="text-sm font-extrabold text-[#2D1810]">
              {rider.name}
            </Text>
            <Text className="text-xs text-[#8E7668]">{rider.phone}</Text>
            <Text className="text-[11px] text-emerald-600 font-bold mt-1">
              Connecting secure VoIP line...
            </Text>
          </View>

          <Pressable
            onPress={() => setIsCallOpen(false)}
            className="mt-4 px-6 py-2 rounded-2xl bg-red-600"
          >
            <Text className="text-white text-xs font-bold">End Call</Text>
          </Pressable>
        </View>
      </BottomSheet>
    </View>
  );
}
