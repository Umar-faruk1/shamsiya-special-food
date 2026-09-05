import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Switch,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Plus, Trash2, MessageSquare, Phone } from "lucide-react-native";
import { UserAddress, PaymentMethod } from "../types";
import {
  AddressCard,
  PaymentMethodCard,
  NotificationItem,
  BottomSheet,
} from "../components/CommonModalsAndCards";
import { PrimaryButton } from "../components/Buttons";
import { RatingStars } from "../components/BadgesAndRatings";
import { AppHeader } from "../components/AppHeader";
import { useApp } from "../context/AppContext";

// Direct port of SupportScreens.tsx (6 screens). Each is wrapped with
// AppHeader + ScrollView since they're pushed as standalone stack screens.

// ---------- NOTIFICATIONS ----------
export function NotificationsScreen() {
  const { notifications, handleMarkAllNotificationsRead, favorites } = useApp();

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader
        currentScreen="Notifications"
        title="Notifications"
        showBack
        favoritesCount={favorites.length}
      />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: 40,
          gap: 12,
        }}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-extrabold text-[#2D1810]">
            Notifications ({notifications.filter((n) => !n.read).length} Unread)
          </Text>
          <Pressable onPress={handleMarkAllNotificationsRead}>
            <Text className="text-xs text-[#E86A17] font-bold">
              Mark all as read
            </Text>
          </Pressable>
        </View>

        <View className="gap-2">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ---------- ADDRESSES ----------
export function AddressesScreen() {
  const {
    user,
    handleAddAddress,
    handleDeleteAddress,
    handleSetDefaultAddress,
  } = useApp();
  const addresses = user.savedAddresses;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [label, setLabel] = useState<UserAddress["label"]>("Home");
  const [street, setStreet] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("Downtown");
  const [phone, setPhone] = useState("+1 (555) 019-2834");

  const handleSave = () => {
    if (!street.trim()) return;
    const newAddr: UserAddress = {
      id: `addr-${Date.now()}`,
      label,
      recipientName: user.name,
      street,
      apartment,
      city,
      postalCode: "75001",
      phone,
      isDefault: addresses.length === 0,
    };
    handleAddAddress(newAddr);
    setIsAddOpen(false);
    setStreet("");
    setApartment("");
  };

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader
        currentScreen="Addresses"
        title="Delivery Addresses"
        showBack
      />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: 40,
          gap: 16,
        }}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-extrabold text-[#2D1810]">
            Delivery Locations ({addresses.length})
          </Text>
          <Pressable
            onPress={() => setIsAddOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#2D1810] flex-row items-center gap-1"
          >
            <Plus width={14} height={14} color="#fff" />
            <Text className="text-white text-xs font-bold">Add Address</Text>
          </Pressable>
        </View>

        <View className="gap-2.5">
          {addresses.map((addr) => (
            <View key={addr.id} className="relative">
              <AddressCard
                address={addr}
                isSelected={addr.isDefault}
                onSelect={() => handleSetDefaultAddress(addr.id)}
              />
              {addresses.length > 1 ? (
                <Pressable
                  onPress={() => handleDeleteAddress(addr.id)}
                  className="absolute top-3 right-3 p-1"
                  accessibilityLabel="Delete address"
                >
                  <Trash2 width={14} height={14} color="#A3A3A3" />
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Delivery Address"
      >
        <View className="gap-3">
          <View>
            <Text className="text-[11px] font-bold text-[#8E7668] mb-1">
              Address Label (e.g. Home, Work, Gym)
            </Text>
            <TextInput
              value={label}
              onChangeText={(value) => {
                if (
                  value === "Home" ||
                  value === "Work" ||
                  value === "Partner" ||
                  value === "Other"
                ) {
                  setLabel(value);
                }
              }}
              className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-[#613D2D]/15 text-[#2D1810]"
            />
          </View>

          <View>
            <Text className="text-[11px] font-bold text-[#8E7668] mb-1">
              Street Address
            </Text>
            <TextInput
              value={street}
              onChangeText={setStreet}
              placeholder="e.g. 742 Evergreen Terrace"
              placeholderTextColor="rgba(142,118,104,0.6)"
              className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-[#613D2D]/15 text-[#2D1810]"
            />
          </View>

          <View>
            <Text className="text-[11px] font-bold text-[#8E7668] mb-1">
              Apartment / Suite / Floor
            </Text>
            <TextInput
              value={apartment}
              onChangeText={setApartment}
              placeholder="e.g. Apt 4B, 4th Floor"
              placeholderTextColor="rgba(142,118,104,0.6)"
              className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-[#613D2D]/15 text-[#2D1810]"
            />
          </View>

          <View>
            <Text className="text-[11px] font-bold text-[#8E7668] mb-1">
              Contact Phone
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-[#613D2D]/15 text-[#2D1810]"
            />
          </View>

          <PrimaryButton fullWidth onPress={handleSave}>
            Save Address
          </PrimaryButton>
        </View>
      </BottomSheet>
    </View>
  );
}

// ---------- PAYMENT METHODS ----------
export function PaymentMethodsScreen() {
  const { user, handleAddPayment, handleSetDefaultPayment } = useApp();
  const paymentMethods = user.savedPaymentMethods;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [cardHolder, setCardHolder] = useState("Faruk Ahmed");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("09/27");

  const handleSaveCard = () => {
    if (!cardNumber.trim()) return;
    const last4 = cardNumber.slice(-4) || "8832";
    const newPm: PaymentMethod = {
      id: `pm-${Date.now()}`,
      type: "card",
      title: "Visa Premium Debit",
      last4,
      expiry,
      isDefault: false,
    };
    handleAddPayment(newPm);
    setIsAddOpen(false);
    setCardNumber("");
  };

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader
        currentScreen="PaymentMethods"
        title="Payment Methods"
        showBack
      />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: 40,
          gap: 16,
        }}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-extrabold text-[#2D1810]">
            Payment Methods ({paymentMethods.length})
          </Text>
          <Pressable
            onPress={() => setIsAddOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#2D1810] flex-row items-center gap-1"
          >
            <Plus width={14} height={14} color="#fff" />
            <Text className="text-white text-xs font-bold">Add Card</Text>
          </Pressable>
        </View>

        <View className="gap-2.5">
          {paymentMethods.map((pm) => (
            <PaymentMethodCard
              key={pm.id}
              payment={pm}
              isSelected={pm.isDefault}
              onSelect={() => handleSetDefaultPayment(pm.id)}
            />
          ))}
        </View>
      </ScrollView>

      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Credit / Debit Card"
      >
        <View className="gap-3">
          <View>
            <Text className="text-[11px] font-bold text-[#8E7668] mb-1">
              Cardholder Name
            </Text>
            <TextInput
              value={cardHolder}
              onChangeText={setCardHolder}
              className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-[#613D2D]/15 text-[#2D1810]"
            />
          </View>

          <View>
            <Text className="text-[11px] font-bold text-[#8E7668] mb-1">
              Card Number
            </Text>
            <TextInput
              value={cardNumber}
              onChangeText={setCardNumber}
              placeholder="4111 2222 3333 4444"
              placeholderTextColor="rgba(142,118,104,0.6)"
              keyboardType="number-pad"
              className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-[#613D2D]/15 text-[#2D1810]"
            />
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Text className="text-[11px] font-bold text-[#8E7668] mb-1">
                Expiry (MM/YY)
              </Text>
              <TextInput
                value={expiry}
                onChangeText={setExpiry}
                placeholder="12/28"
                placeholderTextColor="rgba(142,118,104,0.6)"
                className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-[#613D2D]/15 text-[#2D1810]"
              />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-bold text-[#8E7668] mb-1">
                CVV
              </Text>
              <TextInput
                defaultValue="829"
                maxLength={4}
                secureTextEntry
                keyboardType="number-pad"
                className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-[#613D2D]/15 text-[#2D1810]"
              />
            </View>
          </View>

          <PrimaryButton fullWidth onPress={handleSaveCard}>
            Save Secure Card
          </PrimaryButton>
        </View>
      </BottomSheet>
    </View>
  );
}

// ---------- REVIEWS ----------
const reviews = [
  {
    id: "rev-1",
    dishName: "Shamsiya Royal Dum Biryani",
    date: "August 14, 2026",
    rating: 5,
    comment:
      "Incredible tender lamb shank! The saffron aroma filled the entire room. Will definitely reorder.",
  },
  {
    id: "rev-2",
    dishName: "Signature Beef Suya Skewers",
    date: "August 8, 2026",
    rating: 5,
    comment:
      "Authentic peppery Yaji spice. Perfectly charred and smoky. 10/10.",
  },
  {
    id: "rev-3",
    dishName: "Old Delhi Butter Chicken",
    date: "July 29, 2026",
    rating: 4.8,
    comment: "Rich buttery sauce paired deliciously with garlic butter naan.",
  },
];

export function ReviewsScreen() {
  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader currentScreen="Reviews" title="My Reviews" showBack />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: 40,
          gap: 12,
        }}
      >
        <Text className="text-sm font-extrabold text-[#2D1810]">
          My Reviews & Ratings ({reviews.length})
        </Text>

        <View className="gap-3">
          {reviews.map((rev) => (
            <View
              key={rev.id}
              className="bg-white p-3.5 rounded-3xl border border-[#613D2D]/12 gap-1.5"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-[#2D1810]">
                  {rev.dishName}
                </Text>
                <Text className="text-[10px] text-neutral-400">{rev.date}</Text>
              </View>
              <RatingStars rating={rev.rating} size="sm" showNumber />
              <Text className="text-xs text-[#613D2D] leading-relaxed mt-1">
                "{rev.comment}"
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ---------- SETTINGS ----------
export function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(true);

  const Row = ({
    title,
    subtitle,
    value,
    onValueChange,
    isLast,
  }: {
    title: string;
    subtitle: string;
    value: boolean;
    onValueChange: (v: boolean) => void;
    isLast?: boolean;
  }) => (
    <View
      className={`flex-row items-center justify-between ${
        !isLast ? "pt-0 pb-3 border-b border-neutral-100" : ""
      }`}
    >
      <View className="flex-1 pr-3">
        <Text className="text-xs font-bold text-[#2D1810]">{title}</Text>
        <Text className="text-[10px] text-[#8E7668]">{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#D4D4D4", true: "#E86A17" }}
        thumbColor="#fff"
      />
    </View>
  );

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader currentScreen="Settings" title="App Settings" showBack />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: 40,
          gap: 16,
        }}
      >
        <Text className="text-sm font-extrabold text-[#2D1810]">
          App & Privacy Preferences
        </Text>

        <View className="bg-white rounded-3xl border border-[#613D2D]/12 p-4 gap-4">
          <Row
            title="Realtime Order Notifications"
            subtitle="Receive rider updates & cooking progress"
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
          <Row
            title="AI Camera Vision Scanner"
            subtitle="Enable Gemini Multimodal vision food recognition"
            value={aiSuggestionsEnabled}
            onValueChange={setAiSuggestionsEnabled}
          />
          <Row
            title="Precise GPS Delivery Pin"
            subtitle="Accurate doorstep coordinates for riders"
            value={locationEnabled}
            onValueChange={setLocationEnabled}
            isLast
          />
        </View>
      </ScrollView>
    </View>
  );
}

// ---------- HELP & SUPPORT ----------
const faqs = [
  {
    q: "How does the AI Food Scanner work?",
    a: "Our camera scanner uses Gemini vision to analyze dishes, identify authentic ingredients, assess nutrition, and match against Shamsiya Special Food menu recipes.",
  },
  {
    q: "Are all meats 100% Halal?",
    a: "Yes! All poultry, beef, and lamb are 100% certified Halal and freshly butchered daily.",
  },
  {
    q: "How fast is delivery?",
    a: "Our average preparation and delivery time is 25–35 minutes, tracked in realtime with live rider telemetry.",
  },
];

export function HelpSupportScreen() {
  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader currentScreen="HelpSupport" title="Help & Support" showBack />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: 40,
          gap: 16,
        }}
      >
        <View className="p-4 rounded-3xl overflow-hidden border border-[#E86A17]/30">
          <LinearGradient
            colors={["#2D1810", "#45271D"]}
            style={{ position: "absolute", inset: 0 }}
          />
          <Text className="text-sm font-extrabold text-white">
            Shamsiya Customer Care
          </Text>
          <Text className="text-xs text-amber-200 mt-0.5">
            Available 24/7 for instant order assistance & inquiries.
          </Text>

          <View className="flex-row gap-2 mt-3">
            <Pressable className="flex-1 py-2 rounded-xl bg-[#E86A17] flex-row items-center justify-center gap-1">
              <MessageSquare width={14} height={14} color="#fff" />
              <Text className="text-white text-xs font-bold">Live Chat</Text>
            </Pressable>
            <Pressable className="flex-1 py-2 rounded-xl bg-white/20 flex-row items-center justify-center gap-1">
              <Phone width={14} height={14} color="#fff" />
              <Text className="text-white text-xs font-bold">Call Support</Text>
            </Pressable>
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-xs font-extrabold text-[#2D1810] uppercase tracking-wider">
            Frequently Asked Questions
          </Text>

          <View className="gap-2">
            {faqs.map((faq, i) => (
              <View
                key={i}
                className="bg-white p-3.5 rounded-2xl border border-[#613D2D]/12 gap-1"
              >
                <Text className="text-xs font-bold text-[#2D1810]">
                  {faq.q}
                </Text>
                <Text className="text-xs text-[#613D2D] leading-relaxed">
                  {faq.a}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default HelpSupportScreen;
